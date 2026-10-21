import styles from "./empty-state.module.css";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className={styles.empty} aria-labelledby="empty-state-title">
      <h2 id="empty-state-title" className={styles.title}>
        {title}
      </h2>
      <p className={styles.description}>{description}</p>
      {actionHref && actionLabel ? (
        <a className={styles.action} href={actionHref}>
          {actionLabel}
        </a>
      ) : null}
    </section>
  );
}
