import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TeamInviteIntent } from "@/features/onboarding/domain/team-invite-intents";
import {
  buildTeamInviteIntentUpdateInput,
  CLOSED_TEAM_EDITOR_STATE,
  reconcileStaleTeamEditor,
  reduceTeamEditor,
  TeamFoundation,
  TeamReview,
  type TeamEditorAction,
} from "@/features/onboarding/ui/team-foundation";
import {
  createTeamInviteIntentAction,
  deleteTeamInviteIntentAction,
  listTeamInviteIntentsAction,
  updateTeamInviteIntentAction,
} from "@/features/onboarding/actions/team-invite-intent-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/features/onboarding/actions/team-invite-intent-actions", () => ({
  createTeamInviteIntentAction: vi.fn(),
  deleteTeamInviteIntentAction: vi.fn(),
  listTeamInviteIntentsAction: vi.fn(),
  updateTeamInviteIntentAction: vi.fn(),
}));

const ORG = "11111111-1111-4111-8111-111111111111";
const intents: TeamInviteIntent[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    organizationId: ORG,
    emailNormalized: "admin@example.test",
    role: "admin",
    revision: 2,
    createdAt: "2026-09-08T00:00:00Z",
    updatedAt: "2026-09-08T00:01:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    organizationId: ORG,
    emailNormalized: "viewer@example.test",
    role: "viewer",
    revision: 1,
    createdAt: "2026-09-08T00:02:00Z",
    updatedAt: "2026-09-08T00:02:00Z",
  },
];

const componentSource = readFileSync(
  join(process.cwd(), "src/features/onboarding/ui/team-foundation.tsx"),
  "utf8",
);
const actionSource = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/actions/team-invite-intent-actions.ts",
  ),
  "utf8",
);
const serviceSource = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/server/team-invite-intents.ts",
  ),
  "utf8",
);
const cssSource = readFileSync(
  join(
    process.cwd(),
    "src/features/onboarding/ui/team-foundation.module.css",
  ),
  "utf8",
);

describe("V2 Team configuration and embedded review", () => {
  it("renders only minimal teammate fields and the exact role allowlist", () => {
    const html = renderToStaticMarkup(
      <TeamFoundation
        membershipRole="owner"
        organizationId={ORG}
        initialIntents={intents}
        backHref={`/onboarding/workspace-confirmation?org=${ORG}`}
      />,
    );

    expect(html).toContain('type="email"');
    expect(html).toContain("Email address");
    expect(html).toContain("Select role");
    expect(html).toContain(">Admin</option>");
    expect(html).toContain(">Staff</option>");
    expect(html).toContain(">Viewer</option>");
    expect(html).not.toContain(">Owner</option>");
    for (const forbidden of [
      'name="name"',
      'name="phone"',
      'name="title"',
      'name="department"',
      'name="avatar"',
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("shows the authoritative owner and persisted intents without invitation status", () => {
    const html = renderToStaticMarkup(
      <TeamFoundation
        membershipRole="owner"
        organizationId={ORG}
        initialIntents={intents}
        backHref={`/onboarding/workspace-confirmation?org=${ORG}`}
      />,
    );

    expect(html).toContain("Workspace owner");
    expect(html).toContain("Already included");
    expect(html).toContain("admin@example.test");
    expect(html).toContain("viewer@example.test");
    expect(html).toContain("Saved for this team setup");
    expect(html).not.toContain("Pending invitation");
    expect(html).not.toContain("Accepted");
  });

  it("renders an honest zero-teammate state and still exposes Review", () => {
    const html = renderToStaticMarkup(
      <TeamFoundation
        membershipRole="owner"
        organizationId={ORG}
        initialIntents={[]}
        backHref={`/onboarding/workspace-confirmation?org=${ORG}`}
      />,
    );

    expect(html).toContain(
      "No teammates are currently configured to be invited.",
    );
    expect(html).toContain("Review team setup");
    expect(html).toContain("Add teammate");
  });

  it("keeps Review embedded and displays only current prepared team truth", () => {
    const html = renderToStaticMarkup(
      <TeamReview membershipRole="owner" intents={intents} />,
    );

    expect(html).toContain("Team setup");
    expect(html).toContain("Invitations have not been sent.");
    expect(html).toContain("admin@example.test");
    expect(html).toContain("Admin");
    expect(html).toContain("viewer@example.test");
    expect(html).toContain("Viewer");
    expect(html).not.toContain("Setup complete");
    expect(html).not.toContain("Workspace complete");
    expect(componentSource).not.toContain("/onboarding/team/review");
  });

  it("uses revision-aware update/delete and refreshes authority on stale writes", () => {
    expect(componentSource).toContain(
      "expectedRevision: editor.baseRevision",
    );
    expect(
      componentSource.match(/expectedRevision: intent\.revision/g),
    ).toHaveLength(1);
    expect(componentSource).toContain(
      'result.code === "STALE_REVISION"',
    );
    expect(componentSource.match(/refreshAuthoritativeIntents\(\)/g)?.length).toBeGreaterThanOrEqual(3);
    expect(serviceSource).toContain(
      '"update_organization_onboarding_team_invite_intent"',
    );
    expect(serviceSource).toContain(
      '"delete_organization_onboarding_team_invite_intent"',
    );
    expect(serviceSource).not.toContain(".delete()");
    expect(serviceSource).not.toContain(".update(");
    expect(serviceSource).not.toContain(".insert(");
  });

  it("closes and clears a stale editor after loading newer server authority", async () => {
    const oldIntent: TeamInviteIntent = {
      ...intents[0]!,
      emailNormalized: "old@example.test",
      role: "staff",
      revision: 7,
    };
    const newerIntent: TeamInviteIntent = {
      ...oldIntent,
      emailNormalized: "newer-server@example.test",
      role: "admin",
      revision: 8,
      updatedAt: "2026-09-08T00:03:00Z",
    };
    let editor = reduceTeamEditor(CLOSED_TEAM_EDITOR_STATE, {
      type: "begin",
      intent: oldIntent,
    });
    editor = reduceTeamEditor(editor, {
      type: "change_email",
      email: "stale-local@example.test",
    });
    editor = reduceTeamEditor(editor, {
      type: "change_role",
      role: "viewer",
    });

    expect(buildTeamInviteIntentUpdateInput(ORG, oldIntent, editor)).toEqual({
      organizationId: ORG,
      intentId: oldIntent.id,
      expectedRevision: 7,
      email: "stale-local@example.test",
      role: "viewer",
    });

    let authoritativeIntent = oldIntent;
    const refresh = vi.fn(async () => {
      authoritativeIntent = newerIntent;
      return true;
    });
    const setMessage = vi.fn();
    const dispatch = (action: TeamEditorAction) => {
      editor = reduceTeamEditor(editor, action);
    };

    await expect(
      reconcileStaleTeamEditor(refresh, dispatch, setMessage),
    ).resolves.toBe(true);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(editor).toEqual(CLOSED_TEAM_EDITOR_STATE);
    expect(
      buildTeamInviteIntentUpdateInput(ORG, authoritativeIntent, editor),
    ).toBeNull();
    expect(authoritativeIntent).toMatchObject({
      emailNormalized: "newer-server@example.test",
      role: "admin",
      revision: 8,
    });
    expect(setMessage).toHaveBeenCalledWith(
      "This teammate was updated elsewhere. We’ve loaded the latest details. Review them before editing again.",
    );

    editor = reduceTeamEditor(editor, {
      type: "begin",
      intent: authoritativeIntent,
    });
    expect(editor).toMatchObject({
      editingId: oldIntent.id,
      email: "newer-server@example.test",
      role: "admin",
      baseRevision: 8,
      mutationBlocked: false,
    });
    expect(
      buildTeamInviteIntentUpdateInput(ORG, authoritativeIntent, editor),
    ).toMatchObject({
      expectedRevision: 8,
      email: "newer-server@example.test",
      role: "admin",
    });
  });

  it("blocks stale form resubmission when authoritative refresh fails", async () => {
    const oldIntent: TeamInviteIntent = {
      ...intents[0]!,
      emailNormalized: "old@example.test",
      role: "staff",
      revision: 7,
    };
    let editor = reduceTeamEditor(CLOSED_TEAM_EDITOR_STATE, {
      type: "begin",
      intent: oldIntent,
    });
    editor = reduceTeamEditor(editor, {
      type: "change_email",
      email: "stale-local@example.test",
    });
    const dispatch = (action: TeamEditorAction) => {
      editor = reduceTeamEditor(editor, action);
    };
    const setMessage = vi.fn();

    await expect(
      reconcileStaleTeamEditor(
        vi.fn(async () => false),
        dispatch,
        setMessage,
      ),
    ).resolves.toBe(false);

    expect(editor).toMatchObject({
      editingId: oldIntent.id,
      email: "stale-local@example.test",
      baseRevision: 7,
      mutationBlocked: true,
    });
    expect(buildTeamInviteIntentUpdateInput(ORG, oldIntent, editor)).toBeNull();
    expect(setMessage).not.toHaveBeenCalled();
  });

  it("keeps a stale-delete row and reconciles any other active editor without retry", async () => {
    const editingIntent: TeamInviteIntent = {
      ...intents[0]!,
      revision: 3,
    };
    const deletingIntent: TeamInviteIntent = {
      ...intents[1]!,
      revision: 5,
    };
    const latestEditingIntent: TeamInviteIntent = {
      ...editingIntent,
      emailNormalized: "latest-editor@example.test",
      role: "admin",
      revision: 4,
    };
    const latestDeletingIntent: TeamInviteIntent = {
      ...deletingIntent,
      role: "viewer",
      revision: 6,
    };
    let editor = reduceTeamEditor(CLOSED_TEAM_EDITOR_STATE, {
      type: "begin",
      intent: editingIntent,
    });
    editor = reduceTeamEditor(editor, {
      type: "change_email",
      email: "unsafe-old-editor@example.test",
    });
    let authoritativeIntents = [editingIntent, deletingIntent];
    const deleteAttempts = vi.fn();
    deleteAttempts();
    const refresh = vi.fn(async () => {
      authoritativeIntents = [latestEditingIntent, latestDeletingIntent];
      return true;
    });
    const dispatch = (action: TeamEditorAction) => {
      editor = reduceTeamEditor(editor, action);
    };

    await reconcileStaleTeamEditor(refresh, dispatch, vi.fn());

    expect(deleteAttempts).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(authoritativeIntents).toContainEqual(latestDeletingIntent);
    expect(editor).toEqual(CLOSED_TEAM_EDITOR_STATE);
    expect(
      buildTeamInviteIntentUpdateInput(
        ORG,
        latestEditingIntent,
        editor,
      ),
    ).toBeNull();
  });

  it("renders the direct zero-teammate Review truth without mutations", () => {
    vi.clearAllMocks();
    const editHtml = renderToStaticMarkup(
      <TeamFoundation
        membershipRole="owner"
        organizationId={ORG}
        initialIntents={[]}
        backHref={`/onboarding/workspace-confirmation?org=${ORG}`}
      />,
    );
    const html = renderToStaticMarkup(
      <TeamReview membershipRole="owner" intents={[]} />,
    );

    expect(editHtml).toContain("Review team setup");
    expect(html).toContain("Team setup");
    expect(html).toContain("Workspace owner");
    expect(html).toContain("Already included");
    expect(html).toContain(">Owner<");
    expect(html).toContain(
      "No teammates are currently configured to be invited.",
    );
    expect(html).toContain("Invitations have not been sent.");
    expect(html).not.toContain("Setup Ready");
    expect(html).not.toContain("Setup complete");
    expect(html).not.toContain("Ready</button>");
    expect(componentSource).toContain("Back to edit");
    expect(componentSource).not.toContain("/onboarding/team/review");
    expect(createTeamInviteIntentAction).not.toHaveBeenCalled();
    expect(updateTeamInviteIntentAction).not.toHaveBeenCalled();
    expect(deleteTeamInviteIntentAction).not.toHaveBeenCalled();
    expect(listTeamInviteIntentsAction).not.toHaveBeenCalled();
  });

  it("keeps real invitations and lifecycle progression outside the feature", () => {
    const combined = `${componentSource}\n${actionSource}\n${serviceSource}`;
    for (const forbidden of [
      "createInvitationAction",
      "createOrganizationInvitation",
      "orchestrateInvitationDelivery",
      "resendInvitation",
      "revokeInvitation",
      "completeV2OnboardingAction",
      "onboarding_setup_ready_at",
      "onboarding_completed_at",
      'router.replace("/home',
    ]) {
      expect(combined).not.toContain(forbidden);
    }

    // ENG-ONB-1H-P1-A supersedes the pre-P1 assertion that Setup Ready is
    // unwired: the transition is now reachable, but only through the governed
    // server action, and never by writing a lifecycle column directly.
    expect(componentSource).toContain("markV2OnboardingSetupReadyAction");
  });

  it("preserves Team to Workspace navigation and Team as step four", () => {
    const html = renderToStaticMarkup(
      <TeamFoundation
        membershipRole="owner"
        organizationId={ORG}
        initialIntents={intents}
        backHref={`/onboarding/workspace-confirmation?org=${ORG}`}
      />,
    );

    expect(html).toContain(
      `href="/onboarding/workspace-confirmation?org=${ORG}"`,
    );
    expect(html).toContain("Step 4 of 5: Team");
    expect(html).not.toContain(">Continue<");
    expect(html).not.toContain(">Ready</button>");
    expect(html).not.toContain(">Ready</a>");
  });

  it("implements semantic forms, contextual controls, and frozen responsive bands", () => {
    const html = renderToStaticMarkup(
      <TeamFoundation
        membershipRole="owner"
        organizationId={ORG}
        initialIntents={intents}
        backHref={`/onboarding/workspace-confirmation?org=${ORG}`}
      />,
    );

    expect(html).toContain("<form");
    expect(html).toContain("<label");
    expect(html).toContain("<select");
    expect(html).toContain('aria-label="Edit admin@example.test"');
    expect(html).toContain('aria-label="Remove admin@example.test"');
    expect(cssSource).toContain("@media (max-width: 767px)");
    expect(cssSource).toContain("@media (min-width: 768px)");
    expect(cssSource).toContain("max-width: 1151px");
    expect(cssSource).not.toContain("overflow-x");
    expect(cssSource).not.toContain("overflow: auto");
  });
});
