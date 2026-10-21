import {
  PUBLIC_ABOUT_H1,
  PUBLIC_ABOUT_LEAD,
  PUBLIC_ABOUT_PARAS,
  PUBLIC_ACCESS_AFTER_LINK,
  PUBLIC_ACCESS_BEFORE_LINK,
  PUBLIC_ACCESS_LINK,
  PUBLIC_AUDIENCES_H1,
  PUBLIC_AUDIENCES_LEAD,
  PUBLIC_CONTEXTS,
  PUBLIC_FIT_BODY,
  PUBLIC_FIT_CONTEXT,
  PUBLIC_FIT_MEMBERS,
  PUBLIC_FIT_SHARED,
  PUBLIC_HOW_H1,
  PUBLIC_HOW_LEAD,
  PUBLIC_HOW_STEPS,
  PUBLIC_LOGIN_HREF,
  PUBLIC_AP_COMPLAINT_URL,
  PUBLIC_NOT_FOUND_BODY,
  PUBLIC_NOT_FOUND_H1,
  PUBLIC_PRIVACY_EMAIL,
  PUBLIC_PRIVACY_H1,
  PUBLIC_PRIVACY_LEAD,
  PUBLIC_PRIVACY_MAILTO,
  PUBLIC_PRIVACY_SECTIONS,
  PUBLIC_PRIVACY_VERSION,
  PUBLIC_PLATFORM_H1,
  PUBLIC_PLATFORM_LEAD,
  PUBLIC_PREVIEW_BODY,
  PUBLIC_PREVIEW_LIMIT,
  PUBLIC_WORK,
} from "@/features/public-web/copy";
import {
  PUBLIC_ABOUT_PATH,
  PUBLIC_AUDIENCES_PATH,
  PUBLIC_HOME_PATH,
  PUBLIC_HOW_PATH,
  PUBLIC_PLATFORM_PATH,
  PUBLIC_PRIVACY_PATH,
} from "@/features/public-web/paths";
import { PublicHashFocus } from "@/features/public-web/ui/public-hash-focus";
import { PublicAccessRequest } from "@/features/public-web/ui/public-instagram";
import { PublicShell } from "@/features/public-web/ui/public-shell";
import styles from "./public-homepage.module.css";

export function PublicPlatformPage() {
  return (
    <PublicShell currentPath={PUBLIC_PLATFORM_PATH}>
      <header className={styles.pageLead}>
        <h1 className={styles.h1}>{PUBLIC_PLATFORM_H1}</h1>
        <p className={styles.support}>{PUBLIC_PLATFORM_LEAD}</p>
      </header>
      <section className={styles.section}>
        <h2 className={styles.h2}>Today</h2>
        <p className={styles.body}>{PUBLIC_PREVIEW_BODY}</p>
        <p className={styles.qualifier}>{PUBLIC_PREVIEW_LIMIT}</p>
      </section>
      <section className={styles.section}>
        <h2 className={styles.h2}>Navigatie per context</h2>
        <p className={styles.body}>{PUBLIC_FIT_BODY}</p>
        <ul className={styles.plainList}>
          {PUBLIC_FIT_SHARED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.body}>{PUBLIC_FIT_CONTEXT}</p>
        <p className={styles.body}>{PUBLIC_FIT_MEMBERS}</p>
      </section>
      <section className={styles.section}>
        <h2 className={styles.h2}>Wat je met die onderdelen doet</h2>
        <ul className={styles.cardGrid}>
          {PUBLIC_WORK.map((item) => (
            <li key={item.title} className={styles.card}>
              <h3 className={styles.h3}>{item.title}</h3>
              <p className={styles.body}>{item.body}</p>
            </li>
          ))}
        </ul>
        <p className={styles.body}>
          <a href={PUBLIC_AUDIENCES_PATH}>Bekijk de contexten</a>
        </p>
      </section>
    </PublicShell>
  );
}

export function PublicAudiencesPage() {
  return (
    <PublicShell currentPath={PUBLIC_AUDIENCES_PATH}>
      <header className={styles.pageLead}>
        <h1 className={styles.h1}>{PUBLIC_AUDIENCES_H1}</h1>
        <p className={styles.support}>{PUBLIC_AUDIENCES_LEAD}</p>
      </header>
      <nav className={styles.contextNav} aria-label="Bedrijfscontexten">
        <ul className={styles.contextNavList}>
          {PUBLIC_CONTEXTS.map((context) => (
            <li key={context.id}>
              <a href={`#${context.id}`}>{context.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      {PUBLIC_CONTEXTS.map((context) => (
        <section key={context.id} className={styles.section} id={context.id} tabIndex={-1}>
          <h2 className={styles.h2}>{context.title}</h2>
          <p className={styles.body}>{context.body}</p>
          <p className={styles.qualifier}>{context.limit}</p>
        </section>
      ))}
      <p className={styles.body}>
        <a href={PUBLIC_HOW_PATH}>Lees hoe toegang werkt</a>
      </p>
      <PublicHashFocus />
    </PublicShell>
  );
}

export function PublicHowPage() {
  return (
    <PublicShell currentPath={PUBLIC_HOW_PATH}>
      <header className={styles.pageLead}>
        <h1 className={styles.h1}>{PUBLIC_HOW_H1}</h1>
        <p className={styles.support}>{PUBLIC_HOW_LEAD}</p>
      </header>
      <ol className={styles.steps}>
        {PUBLIC_HOW_STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <p className={styles.stepIndex}>{index + 1}</p>
            <div>
              <h2 className={styles.h2}>{step.title}</h2>
              <p className={styles.body}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className={styles.section}>
        <h2 className={styles.h2}>Toegang vragen</h2>
        <PublicAccessRequest />
        <p className={styles.body}>
          {PUBLIC_ACCESS_BEFORE_LINK}
          <a href={PUBLIC_LOGIN_HREF}>{PUBLIC_ACCESS_LINK}</a>
          {PUBLIC_ACCESS_AFTER_LINK}
        </p>
      </section>
    </PublicShell>
  );
}

export function PublicAboutPage() {
  return (
    <PublicShell currentPath={PUBLIC_ABOUT_PATH}>
      <header className={styles.pageLead}>
        <h1 className={styles.h1}>{PUBLIC_ABOUT_H1}</h1>
        <p className={styles.support}>{PUBLIC_ABOUT_LEAD}</p>
      </header>
      {PUBLIC_ABOUT_PARAS.map((paragraph) => (
        <p key={paragraph} className={styles.body}>
          {paragraph}
        </p>
      ))}
      <p className={styles.body}>
        <a href={PUBLIC_HOME_PATH}>Naar de homepage</a>
      </p>
    </PublicShell>
  );
}

export function PublicPrivacyPage() {
  return (
    <PublicShell currentPath={PUBLIC_PRIVACY_PATH}>
      <header className={styles.pageLead}>
        <h1 className={styles.h1}>{PUBLIC_PRIVACY_H1}</h1>
        <p className={styles.support}>{PUBLIC_PRIVACY_LEAD}</p>
        <p className={styles.qualifier}>{PUBLIC_PRIVACY_VERSION}</p>
      </header>
      {PUBLIC_PRIVACY_SECTIONS.map((section) => (
        <section key={section.title} className={styles.section}>
          <h2 className={styles.h2}>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className={styles.body}>
              {paragraph}
            </p>
          ))}
          {section.title === "Verantwoordelijke" ? (
            <p className={styles.body}>
              <a href={PUBLIC_PRIVACY_MAILTO}>{PUBLIC_PRIVACY_EMAIL}</a>
            </p>
          ) : null}
          {section.title === "Rechten" ? (
            <p className={styles.body}>
              <a href={PUBLIC_AP_COMPLAINT_URL} target="_blank" rel="noopener noreferrer">
                Klacht indienen bij de AP
                <span className={styles.srOnly}> (opent in een nieuw tabblad)</span>
              </a>
            </p>
          ) : null}
        </section>
      ))}
    </PublicShell>
  );
}

export function PublicNotFound() {
  return (
    <PublicShell>
      <header className={styles.pageLead}>
        <h1 className={styles.h1}>{PUBLIC_NOT_FOUND_H1}</h1>
        <p className={styles.support}>{PUBLIC_NOT_FOUND_BODY}</p>
        <p className={styles.heroActions}>
          <a className={styles.textAction} href={PUBLIC_HOME_PATH}>
            Naar de homepage
          </a>
          <a className={styles.signIn} href={PUBLIC_LOGIN_HREF}>
            {PUBLIC_ACCESS_LINK}
          </a>
        </p>
      </header>
    </PublicShell>
  );
}
