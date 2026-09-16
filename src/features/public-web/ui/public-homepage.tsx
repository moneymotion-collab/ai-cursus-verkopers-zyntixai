import {
  PUBLIC_ACCESS_AFTER_LINK,
  PUBLIC_ACCESS_BEFORE_LINK,
  PUBLIC_ACCESS_H2,
  PUBLIC_ACCESS_LINK,
  PUBLIC_ACCESS_STATUS,
  PUBLIC_BETA_EXISTING,
  PUBLIC_BETA_NOW,
  PUBLIC_CS_BODY,
  PUBLIC_CS_H2,
  PUBLIC_CS_QUALIFIER,
  PUBLIC_H1,
  PUBLIC_HONEST_STOP,
  PUBLIC_HOME_HREF,
  PUBLIC_LOGIN_HREF,
  PUBLIC_MECHANISM_BODY,
  PUBLIC_MECHANISM_H2,
  PUBLIC_NAV_BETA,
  PUBLIC_NAV_DISCLOSURE,
  PUBLIC_NAV_MECHANISM,
  PUBLIC_NAV_OVER,
  PUBLIC_NAV_SIGN_IN,
  PUBLIC_SECTION_IDS,
  PUBLIC_SKIP,
  PUBLIC_SUPPORT,
  PUBLIC_TODAY_BODY,
  PUBLIC_TODAY_H2,
  PUBLIC_TODAY_QUALIFIER,
  PUBLIC_TRUST_BODY,
  PUBLIC_TRUST_H2,
  PUBLIC_VALUE_BODY,
  PUBLIC_VALUE_H2,
  PUBLIC_WORDMARK,
} from "@/features/public-web/copy";
import { PublicHashFocus } from "@/features/public-web/ui/public-hash-focus";
import styles from "./public-homepage.module.css";

function ExplorationLinks({
  className,
}: {
  className?: string;
}) {
  return (
    <ul className={className}>
      <li>
        <a href={`#${PUBLIC_SECTION_IDS.over}`}>{PUBLIC_NAV_OVER}</a>
      </li>
      <li>
        <a href={`#${PUBLIC_SECTION_IDS.mechanism}`}>{PUBLIC_NAV_MECHANISM}</a>
      </li>
      <li>
        <a href={`#${PUBLIC_SECTION_IDS.beta}`}>{PUBLIC_NAV_BETA}</a>
      </li>
    </ul>
  );
}

export function PublicHomepage() {
  return (
    <div className={styles.publicWeb} lang="nl">
      <a className={styles.skip} href={`#${PUBLIC_SECTION_IDS.main}`}>
        {PUBLIC_SKIP}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.wordmark} href={PUBLIC_HOME_HREF}>
            {PUBLIC_WORDMARK}
          </a>
          <nav className={styles.nav} aria-label={PUBLIC_NAV_DISCLOSURE}>
            <ExplorationLinks className={`${styles.navList} ${styles.navInline}`} />
            <details className={styles.navDisclosure}>
              <summary className={styles.disclosureToggle}>
                {PUBLIC_NAV_DISCLOSURE}
              </summary>
              <ExplorationLinks className={`${styles.navList} ${styles.disclosurePanel}`} />
            </details>
            <a className={styles.signIn} href={PUBLIC_LOGIN_HREF}>
              {PUBLIC_NAV_SIGN_IN}
            </a>
          </nav>
        </div>
      </header>
      <main
        className={`${styles.main} ${styles.page}`}
        id={PUBLIC_SECTION_IDS.main}
        tabIndex={-1}
      >
        <section className={`${styles.hero} ${styles.reading}`} aria-labelledby="public-h1">
          <h1 className={styles.h1} id="public-h1">
            {PUBLIC_H1}
          </h1>
          <p className={styles.support}>{PUBLIC_SUPPORT}</p>
          <div
            className={styles.beta}
            id={PUBLIC_SECTION_IDS.beta}
            tabIndex={-1}
          >
            <p>{PUBLIC_BETA_NOW}</p>
            <p>{PUBLIC_BETA_EXISTING}</p>
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.reading} ${styles.copy}`}
          id={PUBLIC_SECTION_IDS.over}
          tabIndex={-1}
        >
          <h2 className={styles.h2}>{PUBLIC_VALUE_H2}</h2>
          <p className={styles.body}>{PUBLIC_VALUE_BODY}</p>
        </section>
        <section
          className={`${styles.clusterPair} ${styles.reading} ${styles.copy}`}
          id={PUBLIC_SECTION_IDS.mechanism}
          tabIndex={-1}
        >
          <h2 className={styles.h2}>{PUBLIC_MECHANISM_H2}</h2>
          <p className={styles.body}>{PUBLIC_MECHANISM_BODY}</p>
        </section>
        <section
          className={`${styles.today} ${styles.reading}`}
          id={PUBLIC_SECTION_IDS.today}
          tabIndex={-1}
        >
          <h2 className={styles.h2}>{PUBLIC_TODAY_H2}</h2>
          <p className={styles.body}>{PUBLIC_TODAY_BODY}</p>
          <p className={styles.qualifier}>{PUBLIC_TODAY_QUALIFIER}</p>
        </section>
        <section
          className={`${styles.courseSeller} ${styles.reading} ${styles.copy}`}
          id={PUBLIC_SECTION_IDS.courseSeller}
          tabIndex={-1}
        >
          <h2 className={styles.h2}>{PUBLIC_CS_H2}</h2>
          <p className={styles.body}>{PUBLIC_CS_BODY}</p>
          <p className={styles.qualifier}>{PUBLIC_CS_QUALIFIER}</p>
        </section>
        <section
          className={`${styles.trust} ${styles.reading} ${styles.copy}`}
          id={PUBLIC_SECTION_IDS.trust}
          tabIndex={-1}
        >
          <h2 className={styles.h2}>{PUBLIC_TRUST_H2}</h2>
          <p className={styles.body}>{PUBLIC_TRUST_BODY}</p>
        </section>
        <section
          className={`${styles.access} ${styles.reading}`}
          id={PUBLIC_SECTION_IDS.access}
          tabIndex={-1}
        >
          <h2 className={styles.h2}>{PUBLIC_ACCESS_H2}</h2>
          <p className={styles.body}>{PUBLIC_ACCESS_STATUS}</p>
          <p className={styles.body}>
            {PUBLIC_ACCESS_BEFORE_LINK}
            <a className={styles.bodyLink} href={PUBLIC_LOGIN_HREF}>
              {PUBLIC_ACCESS_LINK}
            </a>
            {PUBLIC_ACCESS_AFTER_LINK}
          </p>
          <p className={styles.body}>{PUBLIC_HONEST_STOP}</p>
        </section>
      </main>
      <footer className={styles.footer}>
        <p className={styles.footerIdentity}>{PUBLIC_WORDMARK}</p>
      </footer>
      <PublicHashFocus />
    </div>
  );
}
