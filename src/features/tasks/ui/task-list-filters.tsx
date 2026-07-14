import {
  buildTaskListQueryString,
  canViewArchivedFilter,
  type TaskListUrlState,
} from "@/features/tasks/ui/task-list-search-params";
import type { TaskMemberOption } from "@/features/tasks/ui/load-task-form-options";
import styles from "./task-list-filters.module.css";

type TaskListFiltersProps = {
  urlState: TaskListUrlState;
  role: "owner" | "admin" | "staff" | "viewer";
  assigneeOptions?: TaskMemberOption[];
};

export function TaskListFilters({ urlState, role, assigneeOptions = [] }: TaskListFiltersProps) {
  const clearHref = `/tasks${buildTaskListQueryString({
    org: urlState.org,
    status: "open",
    archived: false,
    page: 1,
    pageSize: urlState.pageSize,
  })}`;

  return (
    <section className={styles.filters} aria-labelledby="task-filters-heading">
      <h2 id="task-filters-heading" className={styles.heading}>
        Filters
      </h2>
      <form className={styles.form} method="get" action="/tasks">
        {urlState.org ? <input type="hidden" name="org" value={urlState.org} /> : null}

        <div className={styles.field}>
          <label htmlFor="filter-status">Status</label>
          <select id="filter-status" name="status" defaultValue={urlState.status}>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="all">All statuses</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-due-state">Due state</label>
          <select id="filter-due-state" name="dueState" defaultValue={urlState.dueState ?? ""}>
            <option value="">Any due state</option>
            <option value="overdue">Overdue</option>
            <option value="due_today">Due today</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-source">Source</label>
          <select id="filter-source" name="source" defaultValue={urlState.source ?? ""}>
            <option value="">Any source</option>
            <option value="manual">Manual</option>
            <option value="system">System</option>
          </select>
        </div>

        {assigneeOptions.length > 0 ? (
          <div className={styles.field}>
            <label htmlFor="filter-assignee">Assignee</label>
            <select id="filter-assignee" name="assignee" defaultValue={urlState.assignee ?? ""}>
              <option value="">Any assignee</option>
              {assigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className={styles.fieldWide}>
          <label htmlFor="filter-search">Search title</label>
          <input
            id="filter-search"
            name="q"
            type="search"
            defaultValue={urlState.q ?? ""}
            maxLength={200}
            placeholder="Search by title"
          />
        </div>

        {canViewArchivedFilter(role) ? (
          <div className={styles.checkboxField}>
            <input
              id="filter-archived"
              name="archived"
              type="checkbox"
              value="true"
              defaultChecked={urlState.archived}
            />
            <label htmlFor="filter-archived">Show archived tasks</label>
          </div>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.applyButton}>
            Apply filters
          </button>
          <a className={styles.clearLink} href={clearHref}>
            Clear filters
          </a>
        </div>
      </form>
    </section>
  );
}
