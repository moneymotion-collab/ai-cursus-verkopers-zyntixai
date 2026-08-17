"use client";

import { useRef, useState } from "react";
import { startR1InstagramConnectAction } from "@/features/social-media/actions/start-r1-instagram-connect-action";
import styles from "./r1-instagram-connect-panel.module.css";

type R1InstagramConnectPanelProps = {
  organizationId: string;
  hasWorkspace: boolean;
  hasConnectedInstagram: boolean;
};

type Feedback =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string };

function failureMessage(code: string): string {
  switch (code) {
    case "feature_disabled":
      return "Instagram connection is disabled for this environment.";
    case "unauthorized":
      return "Sign in is required.";
    case "forbidden":
      return "Only Owner or Admin may start this connection.";
    case "workspace_not_found":
      return "Social workspace was not found.";
    case "rate_limited":
      return "Too many connection attempts. Wait and try again.";
    case "already_connected":
      return "An Instagram connection already exists for this workspace.";
    case "invalid_request":
      return "The connect request was invalid.";
    default:
      return "Unable to start Instagram connection. Try again.";
  }
}

export function R1InstagramConnectPanel({
  organizationId,
  hasWorkspace,
  hasConnectedInstagram,
}: R1InstagramConnectPanelProps) {
  const pendingRef = useRef(false);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });

  async function onConnect() {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setFeedback({ kind: "pending" });
    try {
      const result = await startR1InstagramConnectAction({ organizationId });
      if (!result.ok) {
        setFeedback({ kind: "error", message: failureMessage(result.code) });
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to start Instagram connection. Try again.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="r1-connect-title">
      <h2 id="r1-connect-title">Connect Instagram (R1)</h2>
      <p className={styles.copy}>
        Uses the dedicated Professional test account only. Publishing remains
        fail-closed until a later owner-authorized publish stage.
      </p>
      <ul className={styles.meta}>
        <li>
          Workspace: {hasWorkspace ? "present" : "will be created on connect"}
        </li>
        <li>
          Instagram connection:{" "}
          {hasConnectedInstagram ? "already present" : "not connected yet"}
        </li>
      </ul>
      <button
        type="button"
        className={styles.button}
        onClick={onConnect}
        disabled={feedback.kind === "pending"}
      >
        {feedback.kind === "pending"
          ? "Starting Instagram authorization…"
          : hasConnectedInstagram
            ? "Start Instagram re-check / connect flow"
            : "Connect Instagram test account"}
      </button>
      {feedback.kind === "error" ? (
        <p className={styles.error} role="alert">
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
