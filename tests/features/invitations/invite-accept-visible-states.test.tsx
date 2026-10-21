import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AcceptInvitationUiCode } from "@/features/invitations/server/accept-invitation-result";
import { ACCEPT_INVITATION_MESSAGES } from "@/features/invitations/server/accept-invitation-result";
import {
  InviteAcceptControls,
  InviteAcceptSignedInView,
} from "@/features/invitations/ui/accept-invitation-button";
import {
  ContinuationSignedOutState,
  FeatureDisabledState,
  INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF,
  INVITE_ACCEPT_EXPLANATIONS,
  INVITE_ACCEPT_HEADINGS,
  INVITE_ACCEPT_REGISTER_HREF,
  INVITE_ACCEPT_SIGN_IN_HREF,
  INVITE_ACCEPT_VERIFY_EMAIL_HREF,
  RecoveryState,
  UnavailableState,
  resolveInviteAcceptSignedInCopy,
} from "@/features/invitations/ui/invite-accept-states";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/features/invitations/actions/accept-invitation-action", () => ({
  acceptInvitationAction: vi.fn(),
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  logoutAction: vi.fn(),
  abandonInvitationRegistrationAction: vi.fn(),
}));

const ACCEPT_RESULT_CODES: readonly AcceptInvitationUiCode[] = [
  "email_mismatch",
  "verification_required",
  "admin_action_required",
  "invitation_unavailable",
  "feature_disabled",
  "auth_required",
  "origin_rejected",
  "unexpected",
];

const DISCLOSURE_PATTERN =
  /\bexpired\b|\brevoked\b|\binvalid\b|\binactive\b|\balready accepted\b|\bused\b|\bpending\b|\bready\b|\bactive\b/i;

const PRIVATE_PATTERN =
  /token=|[0-9a-f]{64}|organizationId|membershipId|invitationId|@/;

function headingOf(html: string): string {
  const match = html.match(
    /<h1 id="invite-accept-title"[^>]*>([\s\S]*?)<\/h1>/,
  );
  expect(match).not.toBeNull();
  return (match?.[1] ?? "").trim();
}

function explanationOf(html: string): string {
  const match = html.match(/<p class="[^"]*copy[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  expect(match).not.toBeNull();
  return (match?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]!);
}

function renderSignedIn(
  resultCode: AcceptInvitationUiCode | null,
  options?: { publicRegistrationEnabled?: boolean; showAccept?: boolean },
): string {
  return renderToStaticMarkup(
    <InviteAcceptSignedInView
      resultCode={resultCode}
      publicRegistrationEnabled={options?.publicRegistrationEnabled ?? false}
      isPending={false}
      showAccept={options?.showAccept ?? true}
      onAccept={() => undefined}
      onSwitchAccount={() => undefined}
    />,
  );
}

function assertPrivateAndOpaque(html: string) {
  expect(html).not.toMatch(PRIVATE_PATTERN);
  expect(html).not.toMatch(DISCLOSURE_PATTERN);
  expect(html).not.toContain("Invitation ready");
}

describe("invite accept visible-state matrix", () => {
  it("feature-disabled uses a temporary-unavailable heading and no Create account", () => {
    const html = renderToStaticMarkup(<FeatureDisabledState />);

    expect(headingOf(html)).toBe(INVITE_ACCEPT_HEADINGS.featureDisabled);
    expect(explanationOf(html)).toBe(INVITE_ACCEPT_EXPLANATIONS.featureDisabled);
    expect(html).toContain("Sign in");
    expect(hrefs(html)).toEqual([INVITE_ACCEPT_SIGN_IN_HREF]);
    expect(html).not.toContain("Create account");
    expect(html).not.toContain("Accept invitation");
    expect(html).not.toContain("Leave invitation flow");
    assertPrivateAndOpaque(html);
  });

  it("opaque unavailable signed-out keeps recovery guidance without terminal status", () => {
    const html = renderToStaticMarkup(
      <UnavailableState
        showAbandon={false}
        publicRegistrationEnabled={false}
      />,
    );

    expect(headingOf(html)).toBe(INVITE_ACCEPT_HEADINGS.unavailable);
    expect(explanationOf(html)).toBe(INVITE_ACCEPT_EXPLANATIONS.unavailable);
    expect(explanationOf(html)).toContain("latest invitation link from your email");
    expect(explanationOf(html)).toContain("sign in");
    expect(explanationOf(html)).toContain("organization administrator");
    expect(hrefs(html)).toEqual([INVITE_ACCEPT_SIGN_IN_HREF]);
    expect(html).toContain("Sign in");
    expect(html).not.toContain("Create account");
    expect(html).not.toContain("Accept invitation");
    expect(html).not.toContain("Leave invitation flow");
    assertPrivateAndOpaque(html);
  });

  it("opaque unavailable with abandon preserves leave-flow and still omits Create account", () => {
    const html = renderToStaticMarkup(
      <UnavailableState
        showAbandon
        publicRegistrationEnabled={false}
      />,
    );

    expect(headingOf(html)).toBe(INVITE_ACCEPT_HEADINGS.unavailable);
    expect(html).toContain("Leave invitation flow");
    expect(html).not.toContain("Create account");
    expect(html).not.toContain(`href="${INVITE_ACCEPT_REGISTER_HREF}"`);
    assertPrivateAndOpaque(html);
  });

  it("recovery keeps reopen heading, abandon action, and no Create account", () => {
    const html = renderToStaticMarkup(
      <RecoveryState publicRegistrationEnabled={false} />,
    );

    expect(headingOf(html)).toBe(INVITE_ACCEPT_HEADINGS.recovery);
    expect(explanationOf(html)).toBe(INVITE_ACCEPT_EXPLANATIONS.recovery);
    expect(html).toContain("Leave invitation flow");
    expect(html).not.toContain("Create account");
    expect(html).not.toContain("Accept invitation");
    expect(hrefs(html)).toEqual([]);
    assertPrivateAndOpaque(html);
  });

  it("signed-out continuation is the only Create account surface and stays invite-gated", () => {
    const html = renderToStaticMarkup(
      <ContinuationSignedOutState publicRegistrationEnabled={false} />,
    );

    expect(headingOf(html)).toBe(INVITE_ACCEPT_HEADINGS.continuation);
    expect(explanationOf(html)).toBe(
      INVITE_ACCEPT_EXPLANATIONS.continuationSignedOut,
    );
    expect(html).toContain("Sign in");
    expect(html).toContain("Create account");
    expect(html).toContain("Leave invitation flow");
    expect(hrefs(html)).toEqual([
      INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF,
      INVITE_ACCEPT_REGISTER_HREF,
    ]);
    expect(html).not.toContain("Invitation ready");
    expect(html).not.toContain("Accept invitation");
    expect(html).not.toMatch(PRIVATE_PATTERN);
    expect(html.toLowerCase()).not.toMatch(
      /\bexpired\b|\brevoked\b|\binvalid\b|\binactive\b|\bpending\b|\bready\b/,
    );
  });

  it("signed-in continuation does not claim the invitation is ready or valid", () => {
    const html = renderSignedIn(null);

    expect(headingOf(html)).toBe(INVITE_ACCEPT_HEADINGS.continuation);
    expect(explanationOf(html)).toBe(
      INVITE_ACCEPT_EXPLANATIONS.continuationSignedIn,
    );
    expect(html).toContain("Accept invitation");
    expect(html).toContain("Leave invitation flow");
    expect(html).not.toContain("Create account");
    expect(html).not.toContain("Invitation ready");
    expect(hrefs(html)).toEqual([]);
    expect(html).not.toMatch(PRIVATE_PATTERN);
  });

  it("InviteAcceptControls idle chrome uses the production signed-in continuation view", () => {
    const html = renderToStaticMarkup(
      <InviteAcceptControls publicRegistrationEnabled={false} showAccept />,
    );

    expect(headingOf(html)).toBe(INVITE_ACCEPT_HEADINGS.continuation);
    expect(html).toContain("Accept invitation");
    expect(html).not.toContain("Create account");
    expect(html).not.toContain("Invitation ready");
  });

  it.each([
    [
      "email_mismatch",
      INVITE_ACCEPT_HEADINGS.emailMismatch,
      ACCEPT_INVITATION_MESSAGES.email_mismatch,
      { hasSwitch: true, verifyHref: false, signInHref: false },
    ],
    [
      "verification_required",
      INVITE_ACCEPT_HEADINGS.verificationRequired,
      ACCEPT_INVITATION_MESSAGES.verification_required,
      { hasSwitch: false, verifyHref: true, signInHref: false },
    ],
    [
      "admin_action_required",
      INVITE_ACCEPT_HEADINGS.adminActionRequired,
      ACCEPT_INVITATION_MESSAGES.admin_action_required,
      { hasSwitch: false, verifyHref: false, signInHref: false },
    ],
    [
      "invitation_unavailable",
      INVITE_ACCEPT_HEADINGS.unavailable,
      INVITE_ACCEPT_EXPLANATIONS.unavailable,
      { hasSwitch: false, verifyHref: false, signInHref: false },
    ],
    [
      "feature_disabled",
      INVITE_ACCEPT_HEADINGS.featureDisabled,
      INVITE_ACCEPT_EXPLANATIONS.featureDisabled,
      { hasSwitch: false, verifyHref: false, signInHref: false },
    ],
    [
      "auth_required",
      INVITE_ACCEPT_HEADINGS.authRequired,
      ACCEPT_INVITATION_MESSAGES.auth_required,
      { hasSwitch: false, verifyHref: false, signInHref: true },
    ],
    [
      "origin_rejected",
      INVITE_ACCEPT_HEADINGS.genericFailure,
      ACCEPT_INVITATION_MESSAGES.origin_rejected,
      { hasSwitch: false, verifyHref: false, signInHref: false },
    ],
    [
      "unexpected",
      INVITE_ACCEPT_HEADINGS.genericFailure,
      ACCEPT_INVITATION_MESSAGES.unexpected,
      { hasSwitch: false, verifyHref: false, signInHref: false },
    ],
  ] as const)(
    "Accept result %s does not remain under a ready heading",
    (code, heading, explanation, actions) => {
      const html = renderSignedIn(code);

      expect(headingOf(html)).toBe(heading);
      expect(explanationOf(html)).toBe(explanation);
      expect(html).toContain('role="alert"');
      expect(html).not.toContain("Invitation ready");
      expect(html).not.toContain("Create account");
      expect(html).toContain("Leave invitation flow");
      expect(html).toContain("Accept invitation");

      if (actions.hasSwitch) {
        expect(html).toContain("Switch account");
      } else {
        expect(html).not.toContain("Switch account");
      }

      if (actions.verifyHref) {
        expect(hrefs(html)).toContain(INVITE_ACCEPT_VERIFY_EMAIL_HREF);
      } else {
        expect(hrefs(html)).not.toContain(INVITE_ACCEPT_VERIFY_EMAIL_HREF);
      }

      if (actions.signInHref) {
        expect(hrefs(html)).toContain(INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF);
      } else {
        expect(hrefs(html)).not.toContain(INVITE_ACCEPT_CONTINUATION_SIGN_IN_HREF);
      }

      expect(html).not.toMatch(PRIVATE_PATTERN);
      if (code === "invitation_unavailable" || code === "feature_disabled") {
        expect(html).not.toMatch(DISCLOSURE_PATTERN);
      }
    },
  );

  it("covers every published Accept UI code in the rendered matrix", () => {
    const rendered = new Set(ACCEPT_RESULT_CODES);
    expect([...rendered]).toEqual([...ACCEPT_RESULT_CODES]);

    for (const code of ACCEPT_RESULT_CODES) {
      const copy = resolveInviteAcceptSignedInCopy(code);
      expect(copy.heading).not.toBe("Invitation ready");
      expect(copy.heading.length).toBeGreaterThan(0);
      expect(renderSignedIn(code)).toContain(copy.heading);
    }
  });

  it("Create account appears only on signed-out continuation", () => {
    const withCreateAccount = [
      renderToStaticMarkup(
        <ContinuationSignedOutState publicRegistrationEnabled={false} />,
      ),
    ];
    const withoutCreateAccount = [
      renderToStaticMarkup(<FeatureDisabledState />),
      renderToStaticMarkup(
        <UnavailableState showAbandon={false} publicRegistrationEnabled={false} />,
      ),
      renderToStaticMarkup(
        <UnavailableState showAbandon publicRegistrationEnabled={false} />,
      ),
      renderToStaticMarkup(<RecoveryState publicRegistrationEnabled={false} />),
      renderSignedIn(null),
      ...ACCEPT_RESULT_CODES.map((code) => renderSignedIn(code)),
    ];

    for (const html of withCreateAccount) {
      expect(html).toContain("Create account");
      expect(html).toContain(`href="${INVITE_ACCEPT_REGISTER_HREF}"`);
    }
    for (const html of withoutCreateAccount) {
      expect(html).not.toContain("Create account");
      expect(html).not.toContain(`href="${INVITE_ACCEPT_REGISTER_HREF}"`);
    }
  });

  it("page still routes the extracted production states without claiming ready", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/invite/accept/page.tsx"),
      "utf8",
    );
    expect(page).toContain("FeatureDisabledState");
    expect(page).toContain("UnavailableState");
    expect(page).toContain("RecoveryState");
    expect(page).toContain("ContinuationSignedOutState");
    expect(page).toContain("InviteAcceptControls");
    expect(page).toContain(
      "Invitations are currently unavailable. Please try again later.",
    );
    expect(page).not.toContain("Invitation ready");
    expect(page).not.toContain("acceptOrganizationInvitation");
  });
});
