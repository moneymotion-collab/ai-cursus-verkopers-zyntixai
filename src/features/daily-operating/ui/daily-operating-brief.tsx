import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import {
  DAILY_OPERATING_CALM_SUPPORTING,
  DAILY_OPERATING_CALM_TITLE,
  buildDailyOperatingModuleHref,
  isDailyOperatingCalmState,
  resolveDailyOperatingCalmActions,
  type DailyOperatingBrief,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";
import { PRODUCT_MODULE_BY_ID } from "@/features/product-access/domain/module-registry";
import type { ModuleNavVisibility } from "@/features/product-access/domain/types";
import { getAttentionSeverityLabel } from "@/features/attention/domain/severity";
import styles from "./daily-operating-brief.module.css";

type DailyOperatingBriefPanelProps = {
  brief: DailyOperatingBrief;
  attentionQueryFailed: boolean;
  tasksQueryFailed: boolean;
  moduleNavVisibility: ModuleNavVisibility;
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
  viewAllHref: string | null;
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
        {viewAllHref ? (
          <Link className={styles.viewAll} href={viewAllHref}>
            {viewAllLabel}
          </Link>
        ) : null}
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

function BriefRow({
  href,
  navigable,
  children,
}: {
  href: string;
  navigable: boolean;
  children: React.ReactNode;
}) {
  if (!navigable) {
    return <div className={styles.row}>{children}</div>;
  }
  return (
    <Link className={styles.row} href={href}>
      {children}
    </Link>
  );
}

export function DailyOperatingBriefPanel({
  brief,
  attentionQueryFailed,
  tasksQueryFailed,
  moduleNavVisibility,
}: DailyOperatingBriefPanelProps) {
  const showOrgAttention = brief.role === "owner" || brief.role === "admin";
  const showCalm = isDailyOperatingCalmState({
    hasAnyActionable: brief.hasAnyActionable,
    attentionQueryFailed,
    tasksQueryFailed,
  });
  const calmActions = showCalm
    ? resolveDailyOperatingCalmActions({
        navVisibility: moduleNavVisibility,
        organizationId: brief.organizationId,
      })
    : [];
  const attentionListHref = moduleNavVisibility.attention
    ? buildDailyOperatingModuleHref(
        PRODUCT_MODULE_BY_ID.attention.route,
        brief.organizationId,
      )
    : null;
  const overdueListHref = moduleNavVisibility.tasks
    ? buildDailyOperatingModuleHref(
        PRODUCT_MODULE_BY_ID.tasks.route,
        brief.organizationId,
        { dueState: "overdue" },
      )
    : null;
  const dueTodayListHref = moduleNavVisibility.tasks
    ? buildDailyOperatingModuleHref(
        PRODUCT_MODULE_BY_ID.tasks.route,
        brief.organizationId,
        { dueState: "due_today" },
      )
    : null;

  const partialTitle = attentionQueryFailed && !tasksQueryFailed
    ? "Attention could not be loaded. Task items below may still be accurate."
    : tasksQueryFailed && !attentionQueryFailed
      ? "Tasks could not be loaded. Attention items below may still be accurate."
      : attentionQueryFailed && tasksQueryFailed
        ? "Some operating data could not be loaded."
        : null;

  return (
    <div className={styles.root}>
      {partialTitle ? (
        <div className={styles.partialWarning}>
          <Alert variant="warning" title={partialTitle} />
        </div>
      ) : null}

      {showCalm ? (
        <div className={styles.calmState} role="status">
          <p className={styles.calmTitle}>{DAILY_OPERATING_CALM_TITLE}</p>
          <p className={styles.calmDescription}>{DAILY_OPERATING_CALM_SUPPORTING}</p>
          {calmActions.length > 0 ? (
            <div className={styles.calmLinks}>
              {calmActions.map((action) => (
                <Link key={action.moduleId} href={action.href}>
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {showOrgAttention ? (
        <Section
          title="Organization attention"
          emptyTitle="Nothing urgent needs organization attention."
          emptyDescription="Critical and high Attention for this organization will appear here."
          viewAllHref={attentionListHref}
          viewAllLabel="View all Attention"
          failed={attentionQueryFailed}
          failedMessage="Unable to load Attention."
          itemCount={brief.organizationAttention.length}
        >
          {brief.organizationAttention.map((item) => (
            <li key={`org-att-${item.id}`}>
              <BriefRow href={item.href} navigable={moduleNavVisibility.attention}>
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
              </BriefRow>
            </li>
          ))}
        </Section>
      ) : null}

      <Section
        title="Assigned to me — Attention"
        emptyTitle="No Attention is assigned to you."
        emptyDescription="Items assigned to you will appear here when they need action."
        viewAllHref={attentionListHref}
        viewAllLabel="View all Attention"
        failed={attentionQueryFailed}
        failedMessage="Unable to load Attention."
        itemCount={brief.myAttention.length}
      >
        {brief.myAttention.map((item) => (
          <li key={`my-att-${item.id}`}>
            <BriefRow href={item.href} navigable={moduleNavVisibility.attention}>
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
            </BriefRow>
          </li>
        ))}
      </Section>

      <Section
        title="Overdue work"
        emptyTitle="No assigned work is overdue."
        emptyDescription="Open tasks assigned to you that are past due will appear here."
        viewAllHref={overdueListHref}
        viewAllLabel="View overdue tasks"
        failed={tasksQueryFailed}
        failedMessage="Unable to load Tasks."
        itemCount={brief.overdueTasks.length}
      >
        {brief.overdueTasks.map((item) => (
          <li key={`overdue-${item.id}`}>
            <BriefRow href={item.href} navigable={moduleNavVisibility.tasks}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.title}</span>
                <span className={styles.rowMeta}>Overdue</span>
              </span>
            </BriefRow>
          </li>
        ))}
      </Section>

      <Section
        title="Due today"
        emptyTitle="No work is due today."
        emptyDescription="Open tasks assigned to you and due today will appear here."
        viewAllHref={dueTodayListHref}
        viewAllLabel="View today’s tasks"
        failed={tasksQueryFailed}
        failedMessage="Unable to load Tasks."
        itemCount={brief.dueTodayTasks.length}
      >
        {brief.dueTodayTasks.map((item) => (
          <li key={`today-${item.id}`}>
            <BriefRow href={item.href} navigable={moduleNavVisibility.tasks}>
              <span className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.title}</span>
                <span className={styles.rowMeta}>Due today</span>
              </span>
            </BriefRow>
          </li>
        ))}
      </Section>
    </div>
  );
}
