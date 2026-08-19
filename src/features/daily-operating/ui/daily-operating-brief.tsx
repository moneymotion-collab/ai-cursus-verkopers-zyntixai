import Link from "next/link";
import type { DailyOperatingBrief } from "@/features/daily-operating/domain/compose-daily-operating-brief";
import { getAttentionSeverityLabel } from "@/features/attention/domain/severity";
import styles from "./daily-operating-brief.module.css";

type DailyOperatingBriefPanelProps = {
  brief: DailyOperatingBrief;
  attentionQueryFailed: boolean;
  tasksQueryFailed: boolean;
};

function Section({
  title,
  emptyTitle,
  emptyDescription,
  viewAllHref,
  viewAllLabel,
  failed,
  failedMessage,
  children,
  itemCount,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  viewAllHref: string;
  viewAllLabel: string;
  failed?: boolean;
  failedMessage?: string;
  children: React.ReactNode;
  itemCount: number;
}) {
  const headingId = title.replace(/\s+/g, "-").toLowerCase();
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.sectionHeader}>
        <h2 id={headingId}>{title}</h2>
        <Link className={styles.viewAll} href={viewAllHref}>
          {viewAllLabel}
        </Link>
      </div>
      {failed ? (
        <p className={styles.errorRow} role="alert">
          {failedMessage ?? "Unable to load this section."}
        </p>
      ) : itemCount === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{emptyTitle}</p>
          <p className={styles.emptyDescription}>{emptyDescription}</p>
        </div>
      ) : (
        <ul className={styles.list}>{children}</ul>
      )}
    </section>
  );
}

export function DailyOperatingBriefPanel({
  brief,
  attentionQueryFailed,
  tasksQueryFailed,
}: DailyOperatingBriefPanelProps) {
  const orgQs = `?org=${encodeURIComponent(brief.organizationId)}`;
  const showOrgAttention = brief.role === "owner" || brief.role === "admin";

  return (
    <div className={styles.root}>
      {(attentionQueryFailed || tasksQueryFailed) && (
        <div className={styles.partialWarning} role="status">
          {attentionQueryFailed && !tasksQueryFailed
            ? "Attention could not be loaded. Task items below may still be accurate."
            : null}
          {tasksQueryFailed && !attentionQueryFailed
            ? "Tasks could not be loaded. Attention items below may still be accurate."
            : null}
          {attentionQueryFailed && tasksQueryFailed
            ? "Some operating data could not be loaded."
            : null}
        </div>
      )}

      {!brief.hasAnyActionable && !attentionQueryFailed && !tasksQueryFailed ? (
        <div className={styles.calmState} role="status">
          <p className={styles.calmTitle}>You are clear for now.</p>
          <p className={styles.calmDescription}>
            Nothing urgent needs your attention and no assigned work is due today.
          </p>
          <div className={styles.calmLinks}>
            <Link href={`/attention${orgQs}`}>Open Attention</Link>
            <Link href={`/tasks${orgQs}`}>Open Tasks</Link>
            <Link href={`/leads${orgQs}`}>Open Leads</Link>
          </div>
        </div>
      ) : null}

      {showOrgAttention ? (
        <Section
          title="Organization attention"
          emptyTitle="Nothing urgent needs organization attention."
          emptyDescription="Critical and high Attention for this organization will appear here."
          viewAllHref={`/attention${orgQs}`}
          viewAllLabel="View all Attention"
          failed={attentionQueryFailed}
          failedMessage="Unable to load Attention."
          itemCount={brief.organizationAttention.length}
        >
          {brief.organizationAttention.map((item) => (
            <li key={`org-att-${item.id}`}>
              <Link className={styles.row} href={item.href}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{item.title}</span>
                  {item.contextLabel ? (
                    <span className={styles.rowMeta}>{item.contextLabel}</span>
                  ) : null}
                </span>
                <span className={styles.severity} data-severity={item.severity}>
                  <span className={styles.srOnly}>Severity </span>
                  {getAttentionSeverityLabel(item.severity)}
                </span>
              </Link>
            </li>
          ))}
        </Section>
      ) : null}

      <Section
        title="Assigned to me — Attention"
        emptyTitle="No Attention is assigned to you."
        emptyDescription="Items assigned to you will appear here when they need action."
        viewAllHref={`/attention${orgQs}`}
        viewAllLabel="View all Attention"
        failed={attentionQueryFailed}
        failedMessage="Unable to load Attention."
        itemCount={brief.myAttention.length}
      >
        {brief.myAttention.map((item) => (
          <li key={`my-att-${item.id}`}>
            <Link className={styles.row} href={item.href}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.title}</span>
                {item.contextLabel ? (
                  <span className={styles.rowMeta}>{item.contextLabel}</span>
                ) : null}
              </span>
              <span className={styles.severity} data-severity={item.severity}>
                <span className={styles.srOnly}>Severity </span>
                {getAttentionSeverityLabel(item.severity)}
              </span>
            </Link>
          </li>
        ))}
      </Section>

      <Section
        title="Overdue work"
        emptyTitle="No assigned work is overdue."
        emptyDescription="Open tasks assigned to you that are past due will appear here."
        viewAllHref={`/tasks${orgQs}&dueState=overdue`}
        viewAllLabel="View overdue tasks"
        failed={tasksQueryFailed}
        failedMessage="Unable to load Tasks."
        itemCount={brief.overdueTasks.length}
      >
        {brief.overdueTasks.map((item) => (
          <li key={`overdue-${item.id}`}>
            <Link className={styles.row} href={item.href}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.title}</span>
                <span className={styles.rowMeta}>Overdue</span>
              </span>
            </Link>
          </li>
        ))}
      </Section>

      <Section
        title="Due today"
        emptyTitle="No work is due today."
        emptyDescription="Open tasks assigned to you and due today will appear here."
        viewAllHref={`/tasks${orgQs}&dueState=due_today`}
        viewAllLabel="View today’s tasks"
        failed={tasksQueryFailed}
        failedMessage="Unable to load Tasks."
        itemCount={brief.dueTodayTasks.length}
      >
        {brief.dueTodayTasks.map((item) => (
          <li key={`today-${item.id}`}>
            <Link className={styles.row} href={item.href}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.title}</span>
                <span className={styles.rowMeta}>Due today</span>
              </span>
            </Link>
          </li>
        ))}
      </Section>
    </div>
  );
}
