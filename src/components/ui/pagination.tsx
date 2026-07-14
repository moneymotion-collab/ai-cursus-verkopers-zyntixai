import styles from "./pagination.module.css";

type PaginationProps = {
  page: number;
  totalPages: number;
  previousHref?: string;
  nextHref?: string;
};

export function Pagination({ page, totalPages, previousHref, nextHref }: PaginationProps) {
  if (totalPages <= 1 && !previousHref && !nextHref) {
    return null;
  }

  const pageLabel = totalPages > 0 ? `Page ${page} of ${totalPages}` : `Page ${page}`;

  return (
    <nav className={styles.pagination} aria-label="Task list pagination">
      {previousHref ? (
        <a className={styles.link} href={previousHref} rel="prev">
          Previous page
        </a>
      ) : (
        <span className={styles.disabled} aria-disabled="true">
          Previous page
        </span>
      )}
      <span className={styles.status} aria-current="page">
        {pageLabel}
      </span>
      {nextHref ? (
        <a className={styles.link} href={nextHref} rel="next">
          Next page
        </a>
      ) : (
        <span className={styles.disabled} aria-disabled="true">
          Next page
        </span>
      )}
    </nav>
  );
}
