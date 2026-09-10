"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  createTeamInviteIntentAction,
  deleteTeamInviteIntentAction,
  listTeamInviteIntentsAction,
  updateTeamInviteIntentAction,
} from "@/features/onboarding/actions/team-invite-intent-actions";
import {
  ensureOnboardingCompletionRunAction,
  markV2OnboardingSetupReadyAction,
} from "@/features/onboarding/actions/onboarding-actions";
import type { OnboardingCompletionRun } from "@/features/onboarding/domain/onboarding-completion-run";
import {
  isValidTeamInviteIntentEmail,
  TEAM_INVITE_INTENT_ROLES,
  type TeamInviteIntent,
  type TeamInviteIntentRole,
} from "@/features/onboarding/domain/team-invite-intents";
import { OnboardingShell } from "./onboarding-shell";
import styles from "./team-foundation.module.css";

type TeamFoundationProps = {
  membershipRole: "owner";
  organizationId: string;
  initialIntents: TeamInviteIntent[];
  backHref: string;
};

type PendingAction =
  | "create"
  | "review"
  | "setup_ready"
  | `update:${string}`
  | `delete:${string}`
  | null;

export type SetupReadyState =
  | { kind: "idle" }
  | { kind: "confirmed"; run: OnboardingCompletionRun };

export type TeamEditorState = {
  editingId: string | null;
  email: string;
  role: TeamInviteIntentRole | "";
  baseRevision: number | null;
  mutationBlocked: boolean;
};

export type TeamEditorAction =
  | { type: "begin"; intent: TeamInviteIntent }
  | { type: "change_email"; email: string }
  | { type: "change_role"; role: TeamInviteIntentRole | "" }
  | { type: "block_stale" }
  | { type: "close" };

export const CLOSED_TEAM_EDITOR_STATE: TeamEditorState = {
  editingId: null,
  email: "",
  role: "",
  baseRevision: null,
  mutationBlocked: false,
};

export function reduceTeamEditor(
  state: TeamEditorState,
  action: TeamEditorAction,
): TeamEditorState {
  switch (action.type) {
    case "begin":
      return {
        editingId: action.intent.id,
        email: action.intent.emailNormalized,
        role: action.intent.role,
        baseRevision: action.intent.revision,
        mutationBlocked: false,
      };
    case "change_email":
      return { ...state, email: action.email };
    case "change_role":
      return { ...state, role: action.role };
    case "block_stale":
      return { ...state, mutationBlocked: true };
    case "close":
      return CLOSED_TEAM_EDITOR_STATE;
  }
}

export function buildTeamInviteIntentUpdateInput(
  organizationId: string,
  intent: TeamInviteIntent,
  editor: TeamEditorState,
) {
  if (
    editor.editingId !== intent.id ||
    editor.mutationBlocked ||
    editor.baseRevision === null ||
    !Number.isInteger(editor.baseRevision) ||
    editor.baseRevision <= 0 ||
    !isValidTeamInviteIntentEmail(editor.email) ||
    !editor.role
  ) {
    return null;
  }

  return {
    organizationId,
    intentId: intent.id,
    expectedRevision: editor.baseRevision,
    email: editor.email,
    role: editor.role,
  };
}

const STALE_UPDATE_RECONCILED_MESSAGE =
  "This teammate was updated elsewhere. We’ve loaded the latest details. Review them before editing again.";
const REMOVED_EDIT_RECONCILED_MESSAGE =
  "This teammate is no longer in the current team setup. We’ve loaded the latest version.";

export type TeamEditorAuthorityReconciliation =
  | "preserve"
  | "close_updated"
  | "close_removed";

export function reconcileTeamEditorWithAuthority(
  editor: TeamEditorState,
  authoritativeIntents: TeamInviteIntent[],
): TeamEditorAuthorityReconciliation {
  if (editor.editingId === null || editor.baseRevision === null) {
    return "preserve";
  }

  const authoritativeIntent = authoritativeIntents.find(
    (intent) => intent.id === editor.editingId,
  );
  if (!authoritativeIntent) {
    return "close_removed";
  }
  if (authoritativeIntent.revision !== editor.baseRevision) {
    return "close_updated";
  }
  return "preserve";
}

export async function reconcileStaleTeamEditor(
  refreshAuthoritativeIntents: () => Promise<boolean>,
  dispatchEditor: (action: TeamEditorAction) => void,
  setMessage: (message: string) => void,
): Promise<boolean> {
  dispatchEditor({ type: "block_stale" });
  const refreshed = await refreshAuthoritativeIntents();
  if (refreshed) {
    dispatchEditor({ type: "close" });
    setMessage(STALE_UPDATE_RECONCILED_MESSAGE);
  }
  return refreshed;
}

export type SetupReadyOutcome =
  | { kind: "confirmed"; run: OnboardingCompletionRun }
  | { kind: "error"; message: string };

/**
 * Orders the two governed calls of the P1-A transition: the completion run is
 * only ensured once durable Setup Ready has actually succeeded, because the
 * database actor gate refuses to ensure a run before Setup Ready is recorded.
 * Neither call carries authoritative state from the browser.
 */
export async function runSetupReadyTransition(
  organizationId: string,
  markSetupReady: typeof markV2OnboardingSetupReadyAction,
  ensureCompletionRun: typeof ensureOnboardingCompletionRunAction,
): Promise<SetupReadyOutcome> {
  const transition = await markSetupReady({ organizationId });
  if (!transition.ok) {
    return { kind: "error", message: transition.message };
  }

  const run = await ensureCompletionRun({ organizationId });
  if (!run.ok) {
    return { kind: "error", message: run.message };
  }

  return { kind: "confirmed", run: run.run };
}

function roleLabel(role: TeamInviteIntentRole): string {
  return `${role[0].toUpperCase()}${role.slice(1)}`;
}

function parseRole(value: string): TeamInviteIntentRole | "" {
  return TEAM_INVITE_INTENT_ROLES.find((role) => role === value) ?? "";
}

export function TeamFoundation({
  membershipRole,
  organizationId,
  initialIntents,
  backHref,
}: TeamFoundationProps) {
  const router = useRouter();
  const emailId = useId();
  const roleId = useId();
  const [mode, setMode] = useState<"edit" | "review">("edit");
  const [intents, setIntents] = useState(initialIntents);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamInviteIntentRole | "">("");
  const [editor, dispatchEditor] = useReducer(
    reduceTeamEditor,
    CLOSED_TEAM_EDITOR_STATE,
  );
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const mutationOwnerRef = useRef<number | null>(null);
  const mutationTokenRef = useRef(0);
  const reviewInFlightRef = useRef(0);
  const authorityEpochRef = useRef(0);
  const acceptedEpochRef = useRef(0);
  const [message, setMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [setupReady, setSetupReady] = useState<SetupReadyState>({
    kind: "idle",
  });

  // Authority invariant: no older async result may replace a newer accepted
  // Team intent snapshot. An open editor is closed only when its own row is
  // missing or has advanced past that editor's immutable base revision.
  const acceptAuthoritativeSnapshot = useCallback(
    (nextIntents: TeamInviteIntent[], epoch: number) => {
      if (epoch < acceptedEpochRef.current) {
        return false;
      }

      const isRepeat = epoch === acceptedEpochRef.current;
      acceptedEpochRef.current = epoch;
      setIntents(nextIntents);
      if (isRepeat) {
        return true;
      }

      const reconciliation = reconcileTeamEditorWithAuthority(
        editorRef.current,
        nextIntents,
      );
      if (reconciliation === "preserve") {
        return true;
      }

      dispatchEditor({ type: "close" });
      setMessage(
        reconciliation === "close_removed"
          ? REMOVED_EDIT_RECONCILED_MESSAGE
          : STALE_UPDATE_RECONCILED_MESSAGE,
      );
      return true;
    },
    [],
  );

  function nextAuthorityEpoch() {
    authorityEpochRef.current += 1;
    return authorityEpochRef.current;
  }

  useEffect(() => {
    acceptAuthoritativeSnapshot(initialIntents, nextAuthorityEpoch());
  }, [acceptAuthoritativeSnapshot, initialIntents]);

  async function applyListResult(
    result: Awaited<ReturnType<typeof listTeamInviteIntentsAction>>,
    epoch: number,
  ): Promise<boolean> {
    if (!result.ok) {
      setMessage(result.message);
      if (
        result.code === "NOT_AUTHENTICATED" ||
        result.code === "NOT_AUTHORIZED" ||
        result.code === "INVALID_LIFECYCLE"
      ) {
        router.refresh();
      }
      return false;
    }
    return acceptAuthoritativeSnapshot(result.intents, epoch);
  }

  async function refreshAuthoritativeIntents(): Promise<boolean> {
    const epoch = nextAuthorityEpoch();
    const result = await listTeamInviteIntentsAction({ organizationId });
    return applyListResult(result, epoch);
  }

  async function refreshAuthoritativeIntentsAt(
    epoch: number,
  ): Promise<boolean> {
    const result = await listTeamInviteIntentsAction({ organizationId });
    return applyListResult(result, epoch);
  }

  function acquireMutation(
    action: Exclude<PendingAction, null>,
  ): number | null {
    if (mutationOwnerRef.current !== null || reviewInFlightRef.current > 0) {
      return null;
    }
    const token = mutationTokenRef.current + 1;
    mutationTokenRef.current = token;
    mutationOwnerRef.current = token;
    setPendingAction(action);
    return token;
  }

  function releaseMutation(token: number) {
    if (mutationOwnerRef.current !== token) {
      return;
    }
    mutationOwnerRef.current = null;
    setPendingAction(null);
  }

  function isAuthorityBusy() {
    return (
      mutationOwnerRef.current !== null || reviewInFlightRef.current > 0
    );
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isAuthorityBusy()) {
      return;
    }

    const validEmail = isValidTeamInviteIntentEmail(email);
    setEmailError(validEmail ? null : "Enter a valid email address.");
    setRoleError(role ? null : "Choose Admin, Staff, or Viewer.");
    if (!validEmail || !role) {
      return;
    }

    const token = acquireMutation("create");
    if (token === null) {
      return;
    }
    const epoch = nextAuthorityEpoch();
    setMessage(null);
    try {
      const result = await createTeamInviteIntentAction({
        organizationId,
        email,
        role,
      });

      if (!result.ok) {
        setEmailError(
          result.code === "INVALID_EMAIL" ? result.message : null,
        );
        setRoleError(result.code === "INVALID_ROLE" ? result.message : null);
        setMessage(result.message);
        return;
      }

      setEmail("");
      setRole("");
      setEmailError(null);
      setRoleError(null);
      await refreshAuthoritativeIntentsAt(epoch);
      router.refresh();
    } finally {
      releaseMutation(token);
    }
  }

  function beginEdit(intent: TeamInviteIntent) {
    if (isAuthorityBusy()) {
      return;
    }
    dispatchEditor({ type: "begin", intent });
    setMessage(null);
  }

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>,
    intent: TeamInviteIntent,
  ) {
    event.preventDefault();
    if (isAuthorityBusy()) {
      return;
    }
    if (
      editor.mutationBlocked ||
      !isValidTeamInviteIntentEmail(editor.email) ||
      !editor.role
    ) {
      setMessage("Enter a valid email and choose Admin, Staff, or Viewer.");
      return;
    }

    const updateInput = buildTeamInviteIntentUpdateInput(
      organizationId,
      intent,
      editor,
    );
    if (!updateInput) {
      return;
    }

    const token = acquireMutation(`update:${intent.id}`);
    if (token === null) {
      return;
    }
    const epoch = nextAuthorityEpoch();
    setMessage(null);
    try {
      const result = await updateTeamInviteIntentAction(updateInput);
      if (!result.ok) {
        if (result.code === "STALE_REVISION") {
          dispatchEditor({ type: "block_stale" });
          await refreshAuthoritativeIntents();
          return;
        }
        setMessage(result.message);
        return;
      }

      dispatchEditor({ type: "close" });
      await refreshAuthoritativeIntentsAt(epoch);
      router.refresh();
    } finally {
      releaseMutation(token);
    }
  }

  async function handleRemove(intent: TeamInviteIntent) {
    if (isAuthorityBusy()) {
      return;
    }

    const token = acquireMutation(`delete:${intent.id}`);
    if (token === null) {
      return;
    }
    const epoch = nextAuthorityEpoch();
    setMessage(null);
    try {
      const result = await deleteTeamInviteIntentAction({
        organizationId,
        intentId: intent.id,
        expectedRevision: intent.revision,
      });

      if (!result.ok) {
        if (result.code === "STALE_REVISION") {
          const editingId = editorRef.current.editingId;
          const refreshed = await refreshAuthoritativeIntents();
          if (!refreshed) {
            return;
          }
          if (editingId !== null && editorRef.current.editingId === null) {
            return;
          }
          if (editingId === null) {
            setMessage(result.message);
          }
          return;
        }
        setMessage(result.message);
        return;
      }

      if (editorRef.current.editingId === intent.id) {
        dispatchEditor({ type: "close" });
      }
      await refreshAuthoritativeIntentsAt(epoch);
      router.refresh();
    } finally {
      releaseMutation(token);
    }
  }

  async function enterReview() {
    if (mutationOwnerRef.current !== null) {
      return;
    }

    reviewInFlightRef.current += 1;
    setPendingAction("review");
    setMessage(null);
    try {
      const refreshed = await refreshAuthoritativeIntents();
      if (refreshed) {
        dispatchEditor({ type: "close" });
        setMode("review");
      }
    } finally {
      reviewInFlightRef.current -= 1;
      if (
        reviewInFlightRef.current === 0 &&
        mutationOwnerRef.current === null
      ) {
        setPendingAction(null);
      }
    }
  }

  // Setup Ready is durable and server-authorized. The completion run is then
  // ensured through the same governed authority, so a retry after a failed
  // ensure replays safely instead of creating a second run.
  async function handleSetupReady() {
    if (isAuthorityBusy() || setupReady.kind === "confirmed") {
      return;
    }

    const token = acquireMutation("setup_ready");
    if (token === null) {
      return;
    }
    setMessage(null);
    try {
      const outcome = await runSetupReadyTransition(
        organizationId,
        markV2OnboardingSetupReadyAction,
        ensureOnboardingCompletionRunAction,
      );
      if (outcome.kind === "error") {
        setMessage(outcome.message);
        return;
      }

      setSetupReady({ kind: "confirmed", run: outcome.run });
    } finally {
      releaseMutation(token);
    }
  }

  const actions =
    mode === "review" ? (
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="action"
          disabled={pendingAction !== null}
          onClick={() => setMode("edit")}
        >
          Back to edit
        </Button>
        {setupReady.kind === "confirmed" ? null : (
          <Button
            type="button"
            size="action"
            disabled={pendingAction !== null}
            onClick={handleSetupReady}
          >
            {pendingAction === "setup_ready"
              ? "Finishing setup…"
              : "Finish setup"}
          </Button>
        )}
      </div>
    ) : (
      <div className={styles.actions}>
        <Link className={styles.backAction} href={backHref}>
          Back
        </Link>
        <Button
          type="button"
          size="action"
          disabled={pendingAction !== null}
          onClick={enterReview}
        >
          {pendingAction === "review" ? "Reviewing…" : "Review team setup"}
        </Button>
      </div>
    );

  return (
    <OnboardingShell
      currentStep="team"
      headingId="team-onboarding-title"
      actions={actions}
    >
      <Surface className={styles.surface}>
        <div className={styles.content}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>
              {mode === "review" ? "Team review" : "Optional"}
            </p>
            <h1 id="team-onboarding-title">Bring your team with you</h1>
            <p>
              {mode === "review"
                ? "Review the team setup currently prepared for this workspace."
                : "Your workspace already includes its owner. Adding teammates is optional."}
            </p>
          </header>

          {message ? (
            <div className={styles.message} role="alert">
              {message}
            </div>
          ) : null}

          {mode === "review" ? (
            <>
              <TeamReview
                membershipRole={membershipRole}
                intents={intents}
              />
              <SetupReadyStatus state={setupReady} />
            </>
          ) : (
            <>
              <section
                className={styles.team}
                aria-labelledby="team-onboarding-current"
              >
                <h2 id="team-onboarding-current">Current team</h2>
                <OwnerRow membershipRole={membershipRole} />
                {intents.length === 0 ? (
                  <p className={styles.emptyState}>
                    No teammates are currently configured to be invited.
                  </p>
                ) : (
                  <ul className={styles.memberList}>
                    {intents.map((intent) => (
                      <li className={styles.member} key={intent.id}>
                        {editor.editingId === intent.id ? (
                          <form
                            className={styles.editForm}
                            onSubmit={(event) => handleUpdate(event, intent)}
                            aria-label={`Edit ${intent.emailNormalized}`}
                          >
                            <label>
                              <span>Email address</span>
                              <input
                                type="email"
                                value={editor.email}
                                onChange={(event) =>
                                  dispatchEditor({
                                    type: "change_email",
                                    email: event.target.value,
                                  })
                                }
                                required
                              />
                            </label>
                            <label>
                              <span>Role</span>
                              <select
                                value={editor.role}
                                onChange={(event) =>
                                  dispatchEditor({
                                    type: "change_role",
                                    role: parseRole(event.target.value),
                                  })
                                }
                                required
                              >
                                {TEAM_INVITE_INTENT_ROLES.map((value) => (
                                  <option key={value} value={value}>
                                    {roleLabel(value)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className={styles.rowActions}>
                              <Button
                                type="submit"
                                disabled={
                                  pendingAction !== null ||
                                  editor.mutationBlocked
                                }
                                aria-label={`Save changes for ${intent.emailNormalized}`}
                              >
                                {pendingAction === `update:${intent.id}`
                                  ? "Saving…"
                                  : "Save"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={pendingAction !== null}
                                onClick={() =>
                                  dispatchEditor({ type: "close" })
                                }
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <span className={styles.memberIdentity}>
                              <strong>{intent.emailNormalized}</strong>
                              <span>Saved for this team setup</span>
                            </span>
                            <span className={styles.role}>
                              {roleLabel(intent.role)}
                            </span>
                            <div className={styles.rowActions}>
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={pendingAction !== null}
                                onClick={() => beginEdit(intent)}
                                aria-label={`Edit ${intent.emailNormalized}`}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={pendingAction !== null}
                                onClick={() => handleRemove(intent)}
                                aria-label={`Remove ${intent.emailNormalized}`}
                              >
                                {pendingAction === `delete:${intent.id}`
                                  ? "Removing…"
                                  : "Remove"}
                              </Button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section
                className={styles.addSection}
                aria-labelledby="team-add-title"
              >
                <div>
                  <h2 id="team-add-title">Add teammate</h2>
                  <p>This saves team setup only. No invitation is sent yet.</p>
                </div>
                <form
                  className={styles.addForm}
                  onSubmit={handleCreate}
                  aria-busy={pendingAction === "create"}
                  noValidate
                >
                  <label htmlFor={emailId}>
                    Email address
                    <input
                      id={emailId}
                      type="email"
                      value={email}
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={
                        emailError ? `${emailId}-error` : undefined
                      }
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailError(null);
                      }}
                      onBlur={() =>
                        setEmailError(
                          email && !isValidTeamInviteIntentEmail(email)
                            ? "Enter a valid email address."
                            : null,
                        )
                      }
                      required
                    />
                    {emailError ? (
                      <span
                        className={styles.fieldError}
                        id={`${emailId}-error`}
                      >
                        {emailError}
                      </span>
                    ) : null}
                  </label>
                  <label htmlFor={roleId}>
                    Role
                    <select
                      id={roleId}
                      value={role}
                      aria-invalid={Boolean(roleError)}
                      aria-describedby={
                        roleError ? `${roleId}-error` : undefined
                      }
                      onChange={(event) => {
                        setRole(parseRole(event.target.value));
                        setRoleError(null);
                      }}
                      required
                    >
                      <option value="">Select role</option>
                      {TEAM_INVITE_INTENT_ROLES.map((value) => (
                        <option key={value} value={value}>
                          {roleLabel(value)}
                        </option>
                      ))}
                    </select>
                    {roleError ? (
                      <span
                        className={styles.fieldError}
                        id={`${roleId}-error`}
                      >
                        {roleError}
                      </span>
                    ) : null}
                  </label>
                  <Button
                    type="submit"
                    size="action"
                    disabled={
                      pendingAction !== null ||
                      !isValidTeamInviteIntentEmail(email) ||
                      !role
                    }
                  >
                    {pendingAction === "create" ? "Adding…" : "Add teammate"}
                  </Button>
                </form>
              </section>
            </>
          )}
        </div>
      </Surface>
    </OnboardingShell>
  );
}

export function SetupReadyStatus({ state }: { state: SetupReadyState }) {
  return (
    <div className={styles.setupStatus} role="status" aria-live="polite">
      {state.kind === "confirmed" ? (
        <>
          <strong>Setup confirmed</strong>
          <span>
            Your workspace and team setup is saved. No invitations have been
            sent yet.
          </span>
        </>
      ) : (
        <>
          <strong>Finish setup</strong>
          <span>
            This saves your workspace and team setup for good. No invitations
            are sent yet.
          </span>
        </>
      )}
    </div>
  );
}

function OwnerRow({ membershipRole }: { membershipRole: "owner" }) {
  return (
    <ul className={styles.memberList}>
      <li className={`${styles.member} ${styles.owner}`}>
        <span className={styles.memberIdentity}>
          <strong>Workspace owner</strong>
          <span>Already included</span>
        </span>
        <span className={styles.role}>
          {membershipRole === "owner" ? "Owner" : ""}
        </span>
      </li>
    </ul>
  );
}

export function TeamReview({
  membershipRole,
  intents,
}: {
  membershipRole: "owner";
  intents: TeamInviteIntent[];
}) {
  return (
    <section className={styles.review} aria-labelledby="team-review-title">
      <h2 id="team-review-title">Team setup</h2>
      <p className={styles.reviewNote}>
        This review shows what is prepared. Invitations have not been sent.
      </p>
      <dl className={styles.reviewList}>
        <div className={styles.reviewItem}>
          <dt>Workspace owner</dt>
          <dd>
            <span>Already included</span>
            <strong>{membershipRole === "owner" ? "Owner" : ""}</strong>
          </dd>
        </div>
        {intents.map((intent) => (
          <div className={styles.reviewItem} key={intent.id}>
            <dt>{intent.emailNormalized}</dt>
            <dd>
              <span>Prepared teammate</span>
              <strong>{roleLabel(intent.role)}</strong>
            </dd>
          </div>
        ))}
      </dl>
      {intents.length === 0 ? (
        <p className={styles.emptyState}>
          No teammates are currently configured to be invited.
        </p>
      ) : null}
    </section>
  );
}
