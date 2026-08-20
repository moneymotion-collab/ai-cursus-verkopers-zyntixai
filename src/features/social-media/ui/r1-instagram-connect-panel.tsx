"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startR1InstagramConnectAction } from "@/features/social-media/actions/start-r1-instagram-connect-action";
import { initiateInstagramReauthorizationAction } from "@/features/social-media/actions/initiate-instagram-reauthorization-action";
import { disconnectSocialConnectionAction } from "@/features/social-media/actions/disconnect-social-connection-action";
import styles from "./r1-instagram-connect-panel.module.css";

type R1InstagramConnectPanelProps = {
  organizationId: string;
  hasWorkspace: boolean;
  connectedConnectionId: string | null;
};

type Feedback =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string };

function connectFailureMessage(code: string): string {
  switch (code) {
    case "feature_disabled":
      return "Instagram connection is disabled for this environment.";
    case "unauthorized":
      return "Sign in is required.";
    case "forbidden":
      return "Only Owner or Admin may start this connection.";
    case "closed_beta_not_enrolled":
      return "Social closed beta is not enabled for this organization.";
    case "closed_beta_paused":
      return "Connecting Instagram is unavailable while Social beta access is paused.";
    case "closed_beta_revoked":
      return "Connecting Instagram is unavailable because closed-beta access is no longer active.";
    case "workspace_not_found":
      return "Social workspace was not found.";
    case "rate_limited":
      return "Too many connection attempts. Wait and try again.";
    case "already_connected":
      return "An Instagram connection already exists for this organization. Use Reconnect instead.";
    case "connection_not_found":
      return "That Instagram connection was not found for this organization.";
    case "invalid_request":
      return "The connect request was invalid.";
    default:
      return "Unable to start Instagram authorization. Try again.";
  }
}

function disconnectFailureMessage(code: string): string {
  switch (code) {
    case "feature_disabled":
      return "Instagram connection is disabled for this environment.";
    case "unauthorized":
      return "Sign in is required.";
    case "forbidden":
      return "Only Owner or Admin may disconnect this account.";
    case "not_found":
      return "That Instagram connection was not found for this organization.";
    case "rate_limited":
      return "Too many disconnect attempts. Wait and try again.";
    default:
      return "Unable to disconnect Instagram. Try again.";
  }
}

export function R1InstagramConnectPanel({
  organizationId,
  hasWorkspace,
  connectedConnectionId,
}: R1InstagramConnectPanelProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const isConnected = connectedConnectionId != null;

  async function onConnect() {
    if (pendingRef.current || isConnected) {
      return;
    }
    pendingRef.current = true;
    setFeedback({ kind: "pending" });
    try {
      const result = await startR1InstagramConnectAction({ organizationId });
      if (!result.ok) {
        setFeedback({ kind: "error", message: connectFailureMessage(result.code) });
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to start Instagram authorization. Try again.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  async function onReconnect() {
    if (pendingRef.current || !connectedConnectionId) {
      return;
    }
    pendingRef.current = true;
    setFeedback({ kind: "pending" });
    try {
      const result = await initiateInstagramReauthorizationAction({
        organizationId,
        connectionId: connectedConnectionId,
      });
      if (!result.ok) {
        setFeedback({ kind: "error", message: connectFailureMessage(result.code) });
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to start Instagram authorization. Try again.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  async function onDisconnect() {
    if (pendingRef.current || !connectedConnectionId) {
      return;
    }
    pendingRef.current = true;
    setFeedback({ kind: "pending" });
    try {
      const result = await disconnectSocialConnectionAction({
        organizationId,
        connectionId: connectedConnectionId,
      });
      if (!result.ok) {
        setFeedback({
          kind: "error",
          message: disconnectFailureMessage(result.code),
        });
        return;
      }
      setConfirmDisconnect(false);
      setFeedback({ kind: "idle" });
      router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to disconnect Instagram. Try again.",
      });
    } finally {
      pendingRef.current = false;
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="instagram-connect-title">
      <h2 id="instagram-connect-title">
        {isConnected ? "Instagram account" : "Connect Instagram"}
      </h2>
      <p className={styles.copy}>
        {isConnected
          ? "Reconnect keeps the same Instagram Business account. Disconnect removes the local credential and marks the account disconnected. Historical activity is kept."
          : "Connect an Instagram Business account owned by this organization. Publishing stays off until separately enabled."}
      </p>
      <ul className={styles.meta}>
        <li>
          Workspace: {hasWorkspace ? "ready" : "will be created on connect"}
        </li>
        <li>
          Instagram: {isConnected ? "connected" : "not connected yet"}
        </li>
      </ul>
      <div className={styles.actions}>
        {isConnected ? (
          <>
            <button
              type="button"
              className={styles.button}
              onClick={onReconnect}
              disabled={feedback.kind === "pending"}
            >
              {feedback.kind === "pending"
                ? "Starting Instagram authorization…"
                : "Reconnect Instagram"}
            </button>
            {confirmDisconnect ? (
              <>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={onDisconnect}
                  disabled={feedback.kind === "pending"}
                >
                  {feedback.kind === "pending"
                    ? "Disconnecting…"
                    : "Confirm disconnect"}
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setConfirmDisconnect(false)}
                  disabled={feedback.kind === "pending"}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setConfirmDisconnect(true)}
                disabled={feedback.kind === "pending"}
              >
                Disconnect Instagram
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className={styles.button}
            onClick={onConnect}
            disabled={feedback.kind === "pending"}
          >
            {feedback.kind === "pending"
              ? "Starting Instagram authorization…"
              : "Connect Instagram"}
          </button>
        )}
      </div>
      {confirmDisconnect ? (
        <p className={styles.copy} role="status">
          Confirm disconnect to remove the Instagram credential from this
          organization. You can connect again later.
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
