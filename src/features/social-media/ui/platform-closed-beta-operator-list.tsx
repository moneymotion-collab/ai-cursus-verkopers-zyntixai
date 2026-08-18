import Link from "next/link";
import {
  buildSocialClosedBetaOperatorDetailHref,
  buildSocialClosedBetaOperatorListHref,
  SOCIAL_CLOSED_BETA_OPERATOR_ROUTE,
} from "@/features/social-media/domain/platform-operator-navigation";
import type { OperatorOrgListItem } from "@/features/social-media/server/platform-closed-beta-operator";
import styles from "./platform-closed-beta-operator-list.module.css";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "not_enrolled", label: "Not enrolled" },
  { value: "approved", label: "Approved" },
  { value: "publishing_allowed", label: "Publishing allowed" },
  { value: "paused", label: "Paused" },
  { value: "revoked", label: "Revoked" },
] as const;

export function PlatformClosedBetaOperatorList(props: {
  items: OperatorOrgListItem[];
  q: string;
  status: string;
  globalPublishingEnabled: boolean;
}) {
  const q = props.q.trim().toLowerCase();
  const filtered = props.items.filter((item) => {
    if (props.status && props.status !== "all") {
      if (item.enrollmentStatus !== props.status) {
        return false;
      }
    }
    if (!q) {
      return true;
    }
    return (
      item.organizationName.toLowerCase().includes(q) ||
      item.organizationId.toLowerCase().includes(q)
    );
  });

  return (
    <section className={styles.root} aria-labelledby="operator-list-title">
      <div className={styles.banner} role="status">
        {props.globalPublishingEnabled
          ? "Global Social publishing is currently ON."
          : "Global Social publishing is currently OFF."}
      </div>

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Internal operator</p>
          <h1 id="operator-list-title">Social closed-beta enrollments</h1>
          <p className={styles.lede}>
            Manage organization entitlement under the global publishing kill
            switch. Viewing does not create enrollment rows.
          </p>
        </div>
      </header>

      <form className={styles.filters} method="get" action={SOCIAL_CLOSED_BETA_OPERATOR_ROUTE}>
        <label className={styles.label}>
          Search
          <input
            className={styles.input}
            name="q"
            defaultValue={props.q}
            placeholder="Organization name or id"
          />
        </label>
        <label className={styles.label}>
          Status
          <select className={styles.input} name="status" defaultValue={props.status || "all"}>
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles.button}>
          Apply
        </button>
        <Link className={styles.clear} href={buildSocialClosedBetaOperatorListHref()}>
          Clear
        </Link>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Organization</th>
              <th scope="col">Enrollment</th>
              <th scope="col">Workspace</th>
              <th scope="col">Instagram</th>
              <th scope="col">Credential</th>
              <th scope="col">publish_image</th>
              <th scope="col">Publications</th>
              <th scope="col">Diagnostic</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>No organizations match this filter.</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.organizationId}>
                  <td>
                    <Link href={buildSocialClosedBetaOperatorDetailHref(item.organizationId)}>
                      {item.organizationName}
                    </Link>
                    <div className={styles.meta}>{item.organizationId}</div>
                  </td>
                  <td>
                    <code>{item.enrollmentStatus}</code>
                  </td>
                  <td>{item.hasSocialWorkspace ? "Yes" : "No"}</td>
                  <td>
                    {item.instagramConnectionCount} connected
                    <div className={styles.meta}>
                      {item.healthyInstagramConnectionCount} healthy
                    </div>
                  </td>
                  <td>{item.credentialPresentCount > 0 ? "Yes" : "No"}</td>
                  <td>{item.publishImageCapabilityCount > 0 ? "Yes" : "No"}</td>
                  <td>
                    {item.activePublicationCount} active
                    <div className={styles.meta}>
                      {item.queuedPublicationCount} queued
                    </div>
                  </td>
                  <td>{item.diagnostic.diagnosticSummary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
