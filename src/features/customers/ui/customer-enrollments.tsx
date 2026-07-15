import type { CustomerEnrollmentSummary } from "@/features/customers/domain/read-types";
import { formatCustomerDate } from "@/features/customers/ui/customer-presentation";
import styles from "./customer-enrollments.module.css";

type CustomerEnrollmentSectionProps = {
  enrollments: CustomerEnrollmentSummary[];
  enrollmentState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  reloadHref?: string;
  timeZone?: string;
};

export function CustomerEnrollmentSection({
  enrollments,
  enrollmentState,
  reloadHref,
  timeZone = "UTC",
}: CustomerEnrollmentSectionProps) {
  if (enrollmentState.kind === "hidden") {
    return null;
  }

  if (enrollmentState.kind === "error") {
    return (
      <section className={styles.section} aria-labelledby="customer-enrollments-title">
        <h2 id="customer-enrollments-title">Enrollment summary</h2>
        <div className={styles.error} role="alert">
          <p>{enrollmentState.message}</p>
          {reloadHref ? (
            <p>
              <a href={reloadHref}>Reload page</a>
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (enrollmentState.kind === "empty" || enrollments.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="customer-enrollments-title">
        <h2 id="customer-enrollments-title">Enrollment summary</h2>
        <p className={styles.empty}>No enrollments are linked to this customer.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="customer-enrollments-title">
      <h2 id="customer-enrollments-title">Enrollment summary</h2>
      <ul className={styles.list}>
        {enrollments.map((enrollment) => (
          <li key={enrollment.enrollmentId} className={styles.item}>
            <p className={styles.program}>{enrollment.programName}</p>
            <p className={styles.meta}>
              {enrollment.statusLabel}
              {" · "}
              Enrolled <time>{formatCustomerDate(enrollment.enrolledAt, timeZone)}</time>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
