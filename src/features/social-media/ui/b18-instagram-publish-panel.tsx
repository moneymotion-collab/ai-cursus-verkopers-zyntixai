"use client";

import { useRef, useState } from "react";
import { prepareB18InstagramImagePublicationAction } from "@/features/social-media/actions/prepare-b18-instagram-image-publication-action";
import { executeB18InstagramImagePublicationAction } from "@/features/social-media/actions/execute-b18-instagram-image-publication-action";
import styles from "./b18-instagram-publish-panel.module.css";

type PublishableConnection = {
  id: string;
  displayName: string | null;
  externalAccountId: string | null;
  capabilitySnapshot: string[];
};

type B18InstagramPublishPanelProps = {
  organizationId: string;
  hasWorkspace: boolean;
  publishableConnections: PublishableConnection[];
  publishingEnabled: boolean;
  prepareAllowed?: boolean;
  prepareBlockedReason?: string | null;
  executeBlockedReason?: string | null;
  initialPublicationId?: string | null;
  /** Server-authoritative controlled-window target (R1-E-R2-P2). */
  authorizedPublicationId?: string | null;
};

type Feedback =
  | { kind: "idle" }
  | { kind: "pending"; label: string }
  | {
      kind: "prepared";
      publicationId: string;
      created: boolean;
    }
  | {
      kind: "selected";
      publicationId: string;
    }
  | {
      kind: "executed";
      publicationId: string;
      outcome: string;
      externalPublicationIdPresent: boolean;
    }
  | { kind: "error"; message: string };

function prepareFailureMessage(code: string, placement: "feed" | "story"): string {
  switch (code) {
    case "feature_disabled":
      return "Instagram connection gates are disabled for this environment.";
    case "unauthorized":
      return "Sign in is required.";
    case "forbidden":
      return "Only Owner or Admin may prepare this publication.";
    case "closed_beta_not_enrolled":
      return "Social closed beta is not enabled for this organization.";
    case "closed_beta_paused":
      return "Social closed beta is paused for this organization.";
    case "closed_beta_revoked":
      return "Social closed beta access was revoked for this organization.";
    case "invalid_jpeg":
      return placement === "story"
        ? "Upload a valid Story JPEG (≤8 MB). 9:16 is recommended to avoid cropping."
        : "Upload a valid JPEG (320–1440px wide, aspect 4:5–1.91, ≤8 MB).";
    case "workspace_not_found":
      return "Social workspace was not found. Connect Instagram first.";
    case "connection_not_found":
      return placement === "story"
        ? "No connected Instagram account with publish_story was found."
        : "No connected Instagram account with publish_image was found.";
    case "workflow_not_ready":
      return "Workflow readiness failed. Try again.";
    case "connection_ineligible":
      return "The selected Instagram connection is not eligible.";
    case "capability_missing":
      return placement === "story"
        ? "publish_story capability is missing on the connection."
        : "publish_image capability is missing on the connection.";
    case "invalid_request":
      return "The prepare request was invalid.";
    case "controlled_window_prepare_blocked":
      return "A controlled publication is currently authorized for execution. Finish or close that window before preparing another publication.";
    default:
      return placement === "story"
        ? "Unable to prepare the Story IMAGE publication."
        : "Unable to prepare the controlled IMAGE publication.";
  }
}

function executeFailureMessage(code: string): string {
  switch (code) {
    case "feature_disabled":
      return "Publishing is temporarily unavailable.";
    case "unauthorized":
      return "Sign in is required.";
    case "forbidden":
      return "Only Owner or Admin may execute this publication.";
    case "closed_beta_not_enrolled":
      return "Social closed beta is not enabled for this organization.";
    case "closed_beta_paused":
      return "Publishing is paused for your organization.";
    case "closed_beta_revoked":
      return "Social closed beta access was revoked for your organization.";
    case "closed_beta_publish_not_allowed":
      return "Publishing access has not been enabled for your organization.";
    case "not_found":
      return "Publication was not found.";
    case "conflict":
    case "stale_claim":
    case "none_due":
      return "Publication could not be claimed in its current state.";
    case "credential_unavailable":
      return "Credential could not be loaded for this connection.";
    case "invalid_request":
      return "The execute request was invalid.";
    case "publication_not_authorized_for_window":
      return "This publication is not authorized for the current publishing window.";
    case "controlled_window_exhausted":
      return "The authorized publishing window has already been used.";
    default:
      return "Unable to execute the controlled IMAGE publication.";
  }
}

export function B18InstagramPublishPanel({
  organizationId,
  hasWorkspace,
  publishableConnections,
  publishingEnabled,
  prepareAllowed = true,
  prepareBlockedReason = null,
  executeBlockedReason = null,
  initialPublicationId = null,
  authorizedPublicationId = null,
}: B18InstagramPublishPanelProps) {
  const pendingRef = useRef(false);
  const [placement, setPlacement] = useState<"feed" | "story">("feed");
  const requiredCapability =
    placement === "story" ? "publish_story" : "publish_image";
  const placementConnections = publishableConnections.filter((connection) =>
    connection.capabilitySnapshot.includes(requiredCapability),
  );
  const [connectionId, setConnectionId] = useState(
    placementConnections[0]?.id ?? "",
  );
  const boundPublicationId =
    authorizedPublicationId?.trim() || initialPublicationId || null;
  const [feedback, setFeedback] = useState<Feedback>(
    boundPublicationId
      ? authorizedPublicationId
        ? { kind: "selected", publicationId: boundPublicationId }
        : { kind: "selected", publicationId: boundPublicationId }
      : { kind: "idle" },
  );
  const [publicationId, setPublicationId] = useState<string | null>(
    boundPublicationId,
  );

  const executeTargetId = authorizedPublicationId?.trim() || publicationId;
  const selectionMismatch =
    !!authorizedPublicationId &&
    !!initialPublicationId &&
    initialPublicationId !== authorizedPublicationId;
  const canExecute = publishingEnabled && !!executeTargetId;

  async function onPrepare(form: HTMLFormElement) {
    if (pendingRef.current) {
      return;
    }
    const fileInput = form.elements.namedItem("file");
    if (!(fileInput instanceof HTMLInputElement) || !fileInput.files?.[0]) {
      setFeedback({
        kind: "error",
        message: "Choose a JPEG file before preparing.",
      });
      return;
    }
    if (!connectionId) {
      setFeedback({
        kind: "error",
        message: `Select a connected Instagram account with ${requiredCapability}.`,
      });
      return;
    }

    pendingRef.current = true;
    setFeedback({
      kind: "pending",
      label:
        placement === "story"
          ? "Preparing Story IMAGE publication…"
          : "Preparing controlled IMAGE publication…",
    });
    try {
      const body = new FormData();
      body.set("organizationId", organizationId);
      body.set("connectionId", connectionId);
      body.set("placement", placement);
      body.set("file", fileInput.files[0]);
      const result = await prepareB18InstagramImagePublicationAction(body);
      if (!result.ok) {
        setFeedback({
          kind: "error",
          message: prepareFailureMessage(result.code, placement),
        });
        return;
      }
      if (!result.publicationId) {
        setFeedback({
          kind: "error",
          message:
            placement === "story"
              ? "Unable to prepare the Story IMAGE publication."
              : "Unable to prepare the controlled IMAGE publication.",
        });
        return;
      }
      // Never retarget an active controlled-window authorization from Prepare.
      if (!authorizedPublicationId) {
        setPublicationId(result.publicationId);
      }
      setFeedback({
        kind: "prepared",
        publicationId: result.publicationId,
        created: result.created,
      });
    } catch {
      setFeedback({
        kind: "error",
        message:
          placement === "story"
            ? "Unable to prepare the Story IMAGE publication."
            : "Unable to prepare the controlled IMAGE publication.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  async function onExecute() {
    if (pendingRef.current || !canExecute || !executeTargetId) {
      return;
    }
    pendingRef.current = true;
    setFeedback({
      kind: "pending",
      label: "Executing controlled IMAGE publication…",
    });
    try {
      const result = await executeB18InstagramImagePublicationAction({
        organizationId,
        publicationId: executeTargetId,
      });
      if (!result.ok) {
        setFeedback({
          kind: "error",
          message: executeFailureMessage(result.code),
        });
        return;
      }
      setFeedback({
        kind: "executed",
        publicationId: result.publicationId,
        outcome: result.outcome,
        externalPublicationIdPresent: result.externalPublicationIdPresent,
      });
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to execute the controlled IMAGE publication.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="instagram-publish-title">
      <h2 id="instagram-publish-title">Publish Instagram IMAGE</h2>
      <p className={styles.copy}>
        Prepare a feed IMAGE or a Story IMAGE. Story IMAGE support is
        implemented; Production Story publishing remains in controlled rollout.
        Story video is not available.
      </p>
      <ul className={styles.meta}>
        <li>Workspace: {hasWorkspace ? "ready" : "connect Instagram first"}</li>
        <li>
          Accounts with {requiredCapability}: {placementConnections.length}
        </li>
        <li>
          Execute:{" "}
          {publishingEnabled
            ? "available when readiness checks pass"
            : executeBlockedReason ?? "unavailable"}
        </li>
        {authorizedPublicationId ? (
          <li>Authorized publication: {authorizedPublicationId}</li>
        ) : null}
      </ul>

      {!prepareAllowed ? (
        <p className={styles.notice} role="status">
          {prepareBlockedReason ??
            "Preparing content is unavailable for this organization."}
        </p>
      ) : placementConnections.length === 0 ? (
        <p className={styles.copy}>
          No connected Instagram account with{" "}
          {placement === "story" ? "Story" : "feed image"} publish capability.
          Connect an account first.
        </p>
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void onPrepare(event.currentTarget);
          }}
        >
          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Placement</legend>
            <label className={styles.radio}>
              <input
                type="radio"
                name="placement"
                value="feed"
                checked={placement === "feed"}
                onChange={() => {
                  setPlacement("feed");
                  const next = publishableConnections.find((row) =>
                    row.capabilitySnapshot.includes("publish_image"),
                  );
                  setConnectionId(next?.id ?? "");
                }}
                disabled={feedback.kind === "pending"}
              />
              Feed
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="placement"
                value="story"
                checked={placement === "story"}
                onChange={() => {
                  setPlacement("story");
                  const next = publishableConnections.find((row) =>
                    row.capabilitySnapshot.includes("publish_story"),
                  );
                  setConnectionId(next?.id ?? "");
                }}
                disabled={feedback.kind === "pending"}
              />
              Story
            </label>
          </fieldset>

          <label className={styles.label} htmlFor="b18-connection">
            Instagram connection
          </label>
          <select
            id="b18-connection"
            className={styles.select}
            value={connectionId}
            onChange={(event) => setConnectionId(event.target.value)}
            disabled={feedback.kind === "pending"}
          >
            {placementConnections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {(connection.displayName || "Instagram").trim()}
                {connection.externalAccountId
                  ? ` · ${connection.externalAccountId}`
                  : ""}
              </option>
            ))}
          </select>

          <label className={styles.label} htmlFor="b18-file">
            JPEG file
          </label>
          <p className={styles.copy}>
            {placement === "story"
              ? "Story IMAGE: JPEG up to 8 MB. 9:16 is recommended to avoid cropping."
              : "Feed IMAGE: JPEG, 320–1440px wide, aspect 4:5–1.91, up to 8 MB."}
          </p>
          <input
            id="b18-file"
            name="file"
            type="file"
            accept="image/jpeg,.jpg,.jpeg"
            className={styles.file}
            disabled={feedback.kind === "pending"}
            required
          />

          <button
            type="submit"
            className={styles.button}
            disabled={feedback.kind === "pending" || !hasWorkspace}
          >
            {feedback.kind === "pending" && feedback.label.startsWith("Preparing")
              ? feedback.label
              : placement === "story"
                ? "Prepare Story IMAGE"
                : "Prepare IMAGE publication"}
          </button>
        </form>
      )}

      {selectionMismatch ? (
        <p className={styles.notice} role="status">
          URL selection differs from the authorized publication. Execute will
          use the authorized publication only.
        </p>
      ) : null}

      {canExecute ? (
        <button
          type="button"
          className={styles.button}
          onClick={() => void onExecute()}
          disabled={feedback.kind === "pending"}
        >
          {feedback.kind === "pending" && feedback.label.startsWith("Executing")
            ? feedback.label
            : "Execute image publish"}
        </button>
      ) : (
        <p className={styles.notice} role="status">
          {executeBlockedReason ??
            "Execute is unavailable. You can still prepare a publication record when prepare is allowed."}
        </p>
      )}

      {feedback.kind === "prepared" ? (
        <p className={styles.success} role="status">
          {feedback.created
            ? "Publication prepared."
            : "Publication already prepared."}{" "}
          Publication ID: {feedback.publicationId}.{" "}
          {executeBlockedReason ??
            "Execute remains subject to publishing availability and readiness checks."}
        </p>
      ) : null}
      {feedback.kind === "selected" ? (
        <p className={styles.notice} role="status">
          Publication selected. Publication ID: {feedback.publicationId}. This
          does not confirm a new Prepare — submit Prepare with a JPEG to create
          or reuse a durable publication.
        </p>
      ) : null}
      {feedback.kind === "executed" ? (
        <p className={styles.success} role="status">
          Outcome: {feedback.outcome}. External id present:{" "}
          {feedback.externalPublicationIdPresent ? "yes" : "no"}. Publication
          ID: {feedback.publicationId}.
        </p>
      ) : null}
      {feedback.kind === "error" ? (
        <p className={styles.error} role="alert">
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
