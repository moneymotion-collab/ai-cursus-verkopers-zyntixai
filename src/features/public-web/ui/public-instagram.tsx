import {
  PUBLIC_INSTAGRAM_BUTTON,
  PUBLIC_INSTAGRAM_FOOTER,
  PUBLIC_INSTAGRAM_LIMIT,
  PUBLIC_INSTAGRAM_NEW_TAB,
  PUBLIC_INSTAGRAM_PROMPT,
  PUBLIC_INSTAGRAM_URL,
  PUBLIC_OFFER,
} from "@/features/public-web/copy";
import styles from "./public-homepage.module.css";

export function PublicInstagramLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={PUBLIC_INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <span className={styles.srOnly}> (opent in een nieuw tabblad)</span>
    </a>
  );
}

export function PublicAccessRequest() {
  return (
    <div className={styles.accessRequest}>
      <p className={styles.body}>{PUBLIC_INSTAGRAM_PROMPT}</p>
      <PublicInstagramLink className={styles.signIn}>
        {PUBLIC_INSTAGRAM_BUTTON}
      </PublicInstagramLink>
      <p className={styles.offer}>{PUBLIC_OFFER}</p>
      <p className={styles.qualifier}>{PUBLIC_INSTAGRAM_LIMIT}</p>
      <p className={styles.qualifier}>{PUBLIC_INSTAGRAM_NEW_TAB}</p>
    </div>
  );
}

export function PublicInstagramFooterLink() {
  return (
    <p className={styles.footerNote}>
      <PublicInstagramLink>{PUBLIC_INSTAGRAM_FOOTER}</PublicInstagramLink>
      <span className={styles.footerHint}>{PUBLIC_INSTAGRAM_NEW_TAB}</span>
    </p>
  );
}
