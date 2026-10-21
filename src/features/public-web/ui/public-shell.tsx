import {
  PUBLIC_FOOTER_NOTE,
  PUBLIC_HOME_HREF,
  PUBLIC_LOGIN_HREF,
  PUBLIC_NAV,
  PUBLIC_NAV_LABEL,
  PUBLIC_NAV_SIGN_IN,
  PUBLIC_PRIVACY_LABEL,
  PUBLIC_SECTION_IDS,
  PUBLIC_SKIP,
  PUBLIC_WORDMARK,
} from "@/features/public-web/copy";
import { PUBLIC_PRIVACY_PATH } from "@/features/public-web/paths";
import { PublicInstagramFooterLink } from "@/features/public-web/ui/public-instagram";
import styles from "./public-homepage.module.css";

function NavLinks({
  currentPath,
  className,
}: {
  currentPath?: string;
  className?: string;
}) {
  return (
    <ul className={className}>
      {PUBLIC_NAV.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            aria-current={currentPath === item.href ? "page" : undefined}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PublicShell({
  children,
  currentPath,
  mainId = PUBLIC_SECTION_IDS.main,
}: {
  children: React.ReactNode;
  currentPath?: string;
  mainId?: string;
}) {
  return (
    <div className={styles.publicWeb} lang="nl">
      <a className={styles.skip} href={`#${mainId}`}>
        {PUBLIC_SKIP}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.wordmark} href={PUBLIC_HOME_HREF}>
            {PUBLIC_WORDMARK}
          </a>
          <nav className={styles.nav} aria-label={PUBLIC_NAV_LABEL}>
            <NavLinks
              currentPath={currentPath}
              className={`${styles.navList} ${styles.navInline}`}
            />
            <details className={styles.navDisclosure}>
              <summary className={styles.disclosureToggle}>{PUBLIC_NAV_LABEL}</summary>
              <NavLinks
                currentPath={currentPath}
                className={`${styles.navList} ${styles.disclosurePanel}`}
              />
            </details>
            <a className={styles.signIn} href={PUBLIC_LOGIN_HREF}>
              {PUBLIC_NAV_SIGN_IN}
            </a>
          </nav>
        </div>
      </header>
      <main className={styles.main} id={mainId} tabIndex={-1}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerIdentity}>{PUBLIC_WORDMARK}</p>
          <nav aria-label="Voettekst">
            <NavLinks currentPath={currentPath} className={styles.footerList} />
          </nav>
          <p className={styles.footerNote}>{PUBLIC_FOOTER_NOTE}</p>
          <p className={styles.footerNote}>
            <a
              href={PUBLIC_PRIVACY_PATH}
              aria-current={currentPath === PUBLIC_PRIVACY_PATH ? "page" : undefined}
            >
              {PUBLIC_PRIVACY_LABEL}
            </a>
          </p>
          <PublicInstagramFooterLink />
          <p className={styles.footerNote}>
            <a href={PUBLIC_LOGIN_HREF}>{PUBLIC_NAV_SIGN_IN}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
