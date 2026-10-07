import {
  PUBLIC_ACCESS_AFTER_LINK,
  PUBLIC_ACCESS_BEFORE_LINK,
  PUBLIC_ACCESS_BODY,
  PUBLIC_ACCESS_H2,
  PUBLIC_ACCESS_LINK,
  PUBLIC_AUDIENCE_HOME_BODY,
  PUBLIC_AUDIENCE_HOME_H2,
  PUBLIC_BETA_EXISTING,
  PUBLIC_BETA_NOW,
  PUBLIC_CLOSE_H2,
  PUBLIC_CONTEXTS,
  PUBLIC_FAQ,
  PUBLIC_FAQ_H2,
  PUBLIC_FIT_BODY,
  PUBLIC_FIT_CONTEXT,
  PUBLIC_FIT_CONTEXT_H,
  PUBLIC_FIT_H2,
  PUBLIC_FIT_MEMBERS,
  PUBLIC_FIT_SHARED,
  PUBLIC_FIT_SHARED_H,
  PUBLIC_H1,
  PUBLIC_LOGIN_HREF,
  PUBLIC_OFFER,
  PUBLIC_PREVIEW_ATTENTION_H,
  PUBLIC_PREVIEW_ATTENTION_SEVERITY,
  PUBLIC_PREVIEW_ATTENTION_TITLE,
  PUBLIC_PREVIEW_BODY,
  PUBLIC_PREVIEW_CAPTION,
  PUBLIC_PREVIEW_H2,
  PUBLIC_PREVIEW_LIMIT,
  PUBLIC_PREVIEW_ORG,
  PUBLIC_PREVIEW_ROLE,
  PUBLIC_PREVIEW_SUBTITLE,
  PUBLIC_PREVIEW_TASK_H,
  PUBLIC_PREVIEW_TASK_META,
  PUBLIC_PREVIEW_TASK_TITLE,
  PUBLIC_PREVIEW_TITLE,
  PUBLIC_SECTION_IDS,
  PUBLIC_SUPPORT,
  PUBLIC_WORK,
  PUBLIC_WORK_H2,
  PUBLIC_WORK_INTRO,
} from "@/features/public-web/copy";
import { PUBLIC_AUDIENCES_PATH, PUBLIC_HOW_PATH, PUBLIC_PLATFORM_PATH, PUBLIC_PRIVACY_PATH } from "@/features/public-web/paths";
import { PublicHashFocus } from "@/features/public-web/ui/public-hash-focus";
import { PublicAccessRequest } from "@/features/public-web/ui/public-instagram";
import { PublicShell } from "@/features/public-web/ui/public-shell";
import styles from "./public-homepage.module.css";

export function PublicHomepage() {
  return (
    <PublicShell currentPath="/">
      <section className={styles.hero} aria-labelledby="public-h1">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{PUBLIC_BETA_NOW}</p>
          <h1 className={styles.h1} id="public-h1">
            {PUBLIC_H1}
          </h1>
          <p className={styles.support}>{PUBLIC_SUPPORT}</p>
          <p className={styles.betaNote}>{PUBLIC_BETA_EXISTING}</p>
          <div className={styles.heroActions}>
            <a className={styles.signIn} href={PUBLIC_LOGIN_HREF}>
              {PUBLIC_ACCESS_LINK}
            </a>
            <p className={styles.offer}>{PUBLIC_OFFER}</p>
            <a className={styles.textAction} href={`#${PUBLIC_SECTION_IDS.preview}`}>
              {PUBLIC_PREVIEW_H2}
            </a>
          </div>
        </div>
        <ProductPreview />
      </section>

      <section className={styles.section} id={PUBLIC_SECTION_IDS.work} tabIndex={-1}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.h2}>{PUBLIC_WORK_H2}</h2>
          <p className={styles.body}>{PUBLIC_WORK_INTRO}</p>
        </div>
        <ul className={styles.cardGrid}>
          {PUBLIC_WORK.map((item) => (
            <li key={item.title} className={styles.card}>
              <h3 className={styles.h3}>{item.title}</h3>
              <p className={styles.body}>{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} id={PUBLIC_SECTION_IDS.fit} tabIndex={-1}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.h2}>{PUBLIC_FIT_H2}</h2>
          <p className={styles.body}>{PUBLIC_FIT_BODY}</p>
        </div>
        <div className={styles.split}>
          <article className={styles.panel}>
            <h3 className={styles.h3}>{PUBLIC_FIT_SHARED_H}</h3>
            <ul className={styles.plainList}>
              {PUBLIC_FIT_SHARED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.body}>{PUBLIC_FIT_MEMBERS}</p>
          </article>
          <article className={styles.panel}>
            <h3 className={styles.h3}>{PUBLIC_FIT_CONTEXT_H}</h3>
            <p className={styles.body}>{PUBLIC_FIT_CONTEXT}</p>
            <p className={styles.body}>
              <a href={PUBLIC_PLATFORM_PATH}>Lees het platform</a>
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} id={PUBLIC_SECTION_IDS.audiences} tabIndex={-1}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.h2}>{PUBLIC_AUDIENCE_HOME_H2}</h2>
          <p className={styles.body}>{PUBLIC_AUDIENCE_HOME_BODY}</p>
        </div>
        <ul className={styles.cardGrid}>
          {PUBLIC_CONTEXTS.map((context) => (
            <li key={context.id} className={styles.card}>
              <h3 className={styles.h3}>
                <a href={`${PUBLIC_AUDIENCES_PATH}#${context.id}`}>{context.title}</a>
              </h3>
              <p className={styles.body}>{context.body}</p>
              <p className={styles.qualifier}>{context.limit}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} id={PUBLIC_SECTION_IDS.access} tabIndex={-1}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.h2}>{PUBLIC_ACCESS_H2}</h2>
          <p className={styles.body}>{PUBLIC_ACCESS_BODY}</p>
          <PublicAccessRequest />
          <p className={styles.body}>
            {PUBLIC_ACCESS_BEFORE_LINK}
            <a href={PUBLIC_LOGIN_HREF}>{PUBLIC_ACCESS_LINK}</a>
            {PUBLIC_ACCESS_AFTER_LINK}
          </p>
          <p className={styles.body}>
            <a href={PUBLIC_HOW_PATH}>Lees de toegangsstappen</a>
          </p>
        </div>
      </section>

      <section className={styles.section} id={PUBLIC_SECTION_IDS.faq} tabIndex={-1}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.h2}>{PUBLIC_FAQ_H2}</h2>
        </div>
        <div className={styles.faqList}>
          {PUBLIC_FAQ.map((item) => (
            <details key={item.question} className={styles.faqItem}>
              <summary>{item.question}</summary>
              <p className={styles.body}>{item.answer}</p>
              {item.question.startsWith("Staan er meetcookies") ? (
                <p className={styles.body}>
                  <a href={PUBLIC_PRIVACY_PATH}>Lees de privacyverklaring</a>
                </p>
              ) : null}
            </details>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.close}`} id={PUBLIC_SECTION_IDS.close} tabIndex={-1}>
        <h2 className={styles.h2}>{PUBLIC_CLOSE_H2}</h2>
        <PublicAccessRequest />
        <p className={styles.body}>
          {PUBLIC_ACCESS_BEFORE_LINK}
          <a href={PUBLIC_LOGIN_HREF}>{PUBLIC_ACCESS_LINK}</a>
          {PUBLIC_ACCESS_AFTER_LINK}
        </p>
      </section>
      <PublicHashFocus />
    </PublicShell>
  );
}

function ProductPreview() {
  return (
    <figure className={styles.preview} id={PUBLIC_SECTION_IDS.preview} tabIndex={-1}>
      <div className={styles.previewChrome} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles.previewBody}>
        <p className={styles.previewKicker}>
          {PUBLIC_PREVIEW_ORG}
          <span aria-hidden="true"> · </span>
          {PUBLIC_PREVIEW_ROLE}
        </p>
        <p className={styles.previewTitle}>{PUBLIC_PREVIEW_TITLE}</p>
        <p className={styles.previewSubtitle}>{PUBLIC_PREVIEW_SUBTITLE}</p>
        <div className={styles.previewBlock}>
          <p className={styles.previewLabel}>{PUBLIC_PREVIEW_ATTENTION_H}</p>
          <div className={styles.previewRow}>
            <span>{PUBLIC_PREVIEW_ATTENTION_TITLE}</span>
            <span className={styles.previewSeverity}>{PUBLIC_PREVIEW_ATTENTION_SEVERITY}</span>
          </div>
        </div>
        <div className={styles.previewBlock}>
          <p className={styles.previewLabel}>{PUBLIC_PREVIEW_TASK_H}</p>
          <div className={styles.previewRow}>
            <span>{PUBLIC_PREVIEW_TASK_TITLE}</span>
            <span className={styles.previewMeta}>{PUBLIC_PREVIEW_TASK_META}</span>
          </div>
        </div>
      </div>
      <figcaption className={styles.previewCaption}>
        <h2 className={styles.h2}>{PUBLIC_PREVIEW_H2}</h2>
        <p className={styles.body}>{PUBLIC_PREVIEW_BODY}</p>
        <p className={styles.qualifier}>{PUBLIC_PREVIEW_LIMIT}</p>
        <p className={styles.qualifier}>{PUBLIC_PREVIEW_CAPTION}</p>
      </figcaption>
    </figure>
  );
}
