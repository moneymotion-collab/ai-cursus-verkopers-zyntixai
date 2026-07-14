import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";
import { Badge } from "@/components/ui/badge";
import type { TaskDisplayLabelBundle } from "@/features/tasks/ui/resolve-task-display-labels";
import { buildTaskDetailHref } from "@/features/tasks/ui/task-navigation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import {
  toTaskListPresentationRow,
  type TaskListPresentationRow,
} from "@/features/tasks/ui/task-presentation";
import styles from "./task-list.module.css";

export type TaskListPresentationProps = {
  tasks: TaskListItemReadModel[];
  timeZone: string;
  listState: TaskListUrlState;
  labels: TaskDisplayLabelBundle;
  emptyTitle: string;
  emptyDescription: string;
  clearFiltersHref?: string;
};

function badgeVariantForDueState(label: string | null): "neutral" | "warning" | "danger" | "info" {
  if (label === "Overdue") return "danger";
  if (label === "Due today") return "warning";
  if (label === "Upcoming") return "info";
  return "neutral";
}

function badgeVariantForStatus(label: string): "neutral" | "success" | "danger" {
  if (label === "Completed") return "success";
  if (label === "Cancelled") return "danger";
  return "neutral";
}

export function mapTasksToPresentationRows(
  tasks: TaskListItemReadModel[],
  timeZone: string,
  listState: TaskListUrlState,
  labels: TaskDisplayLabelBundle,
): TaskListPresentationRow[] {
  return tasks.map((task) =>
    toTaskListPresentationRow(task, timeZone, {
      labels,
      detailHref: buildTaskDetailHref(task.id, listState),
    }),
  );
}

export function TaskListPresentation({
  tasks,
  timeZone,
  listState,
  labels,
  emptyTitle,
  emptyDescription,
  clearFiltersHref,
}: TaskListPresentationProps) {
  const rows = mapTasksToPresentationRows(tasks, timeZone, listState, labels);

  if (rows.length === 0) {
    return (
      <section className={styles.emptyWrap} aria-labelledby="task-list-empty-title">
        <h2 id="task-list-empty-title" className={styles.visuallyHidden}>
          {emptyTitle}
        </h2>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        <p className={styles.emptyDescription}>{emptyDescription}</p>
        {clearFiltersHref ? (
          <a className={styles.clearLink} href={clearFiltersHref}>
            Clear filters
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.tableWrap} aria-busy="false">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Due</th>
              <th scope="col">Priority</th>
              <th scope="col">Assignee</th>
              <th scope="col">Context</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <a className={styles.titleLink} href={row.detailHref}>
                    <span className={styles.titleCell}>{row.title}</span>
                  </a>
                  {row.archivedLabel ? (
                    <span className={styles.archivedInline}>
                      <Badge variant="info">{row.archivedLabel}</Badge>
                    </span>
                  ) : null}
                </td>
                <td>
                  <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
                </td>
                <td>
                  <div>{row.dueAtLabel}</div>
                  {row.dueStateLabel ? (
                    <Badge variant={badgeVariantForDueState(row.dueStateLabel)}>
                      {row.dueStateLabel}
                    </Badge>
                  ) : null}
                </td>
                <td>{row.priorityLabel}</td>
                <td>{row.assigneeLabel}</td>
                <td>{row.linkedContextLabel}</td>
                <td>{row.sourceLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardList} aria-label="Tasks">
        {rows.map((row) => (
          <li key={row.id} className={styles.card}>
            <h3 className={styles.cardTitle}>
              <a className={styles.titleLink} href={row.detailHref}>
                {row.title}
              </a>
            </h3>
            <div className={styles.cardBadges}>
              <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
              {row.archivedLabel ? <Badge variant="info">{row.archivedLabel}</Badge> : null}
              {row.dueStateLabel ? (
                <Badge variant={badgeVariantForDueState(row.dueStateLabel)}>
                  {row.dueStateLabel}
                </Badge>
              ) : null}
            </div>
            <dl className={styles.cardMeta}>
              <div>
                <dt>Due</dt>
                <dd>{row.dueAtLabel}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{row.priorityLabel}</dd>
              </div>
              <div>
                <dt>Assignee</dt>
                <dd>{row.assigneeLabel}</dd>
              </div>
              <div>
                <dt>Context</dt>
                <dd>{row.linkedContextLabel}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{row.sourceLabel}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
