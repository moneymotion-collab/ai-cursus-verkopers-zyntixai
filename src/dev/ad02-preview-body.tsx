import type { ReactNode } from "react";
import { AppShellChrome } from "@/components/app-shell-chrome";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DAILY_OPERATING_TODAY_SUBTITLE,
  type DailyOperatingBrief,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";
import { DailyOperatingBriefPanel } from "@/features/daily-operating/ui/daily-operating-brief";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import homeStyles from "@/app/(authenticated)/home/page.module.css";
import loadingStyles from "@/app/(authenticated)/home/loading.module.css";
import { Ad03RecordsPreview } from "@/dev/ad03-records-preview";
import { Ad04RecordsPreview } from "@/dev/ad04-records-preview";
import { Ad05RecordsPreview } from "@/dev/ad05-records-preview";
import { Ad06RecordsPreview } from "@/dev/ad06-records-preview";
import { Ad07RecordsPreview } from "@/dev/ad07-records-preview";
import { Ad08RecordsPreview } from "@/dev/ad08-records-preview";
import { Ad09RecordsPreview } from "@/dev/ad09-records-preview";
import { Ad10RecordsPreview } from "@/dev/ad10-records-preview";
import { Ad11RecordsPreview } from "@/dev/ad11-records-preview";
import { Ad12RecordsPreview } from "@/dev/ad12-records-preview";
import { Ad13GapPreview } from "@/dev/ad13-gap-preview";
import { courseSellerPreviewHref } from "@/dev/ad02-preview-access";
import styles from "./ad02-preview.module.css";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const MODELS = [
  "course_seller",
  "service",
  "field_operations",
  "product_operations",
] as const satisfies readonly OperatingModelId[];

function modelFrom(value: string | undefined): OperatingModelId {
  return MODELS.includes(value as OperatingModelId)
    ? (value as OperatingModelId)
    : "course_seller";
}

function exampleBrief(
  long: boolean,
  links?: { attention: string; task: string },
): DailyOperatingBrief {
  const title = long
    ? "Example follow-up whose project title is longer than one line on a narrow screen"
    : "Example client missed a contact moment";
  const context = long
    ? "Example riverside workspace with an extended project label"
    : "Example north line";
  return {
    organizationId: ORG,
    membershipId: "example-member",
    role: "owner",
    hasAnyActionable: true,
    organizationAttention: [
      {
        kind: "attention",
        id: "example-att-1",
        title,
        severity: "high",
        status: "open",
        assigneeMemberId: null,
        href: links?.attention ?? `/attention/example-att-1?org=${ORG}`,
        bucket: "high",
        contextLabel: context,
      },
    ],
    myAttention: [
      {
        kind: "attention",
        id: "example-att-2",
        title: long ? title : "Example confirm the first visit",
        severity: "critical",
        status: "open",
        assigneeMemberId: "example-member",
        href: links?.attention ?? `/attention/example-att-2?org=${ORG}`,
        bucket: "critical",
        contextLabel: context,
      },
    ],
    overdueTasks: [
      {
        kind: "task",
        id: "example-task-1",
        title: long ? title : "Example send the revised outline",
        href: links?.task ?? `/tasks/example-task-1?org=${ORG}`,
        bucket: "overdue",
        dueAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    dueTodayTasks: [
      {
        kind: "task",
        id: "example-task-2",
        title: long ? title : "Example call the client back",
        href: links?.task ?? `/tasks/example-task-2?org=${ORG}`,
        bucket: "due_today",
        dueAt: "2026-10-07T00:00:00.000Z",
      },
    ],
  };
}

const COURSE_SELLER_PREVIEW = "course-seller";

export function Ad02PreviewBody({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const requested = typeof searchParams.state === "string" ? searchParams.state : "populated";
  const courseSellerLayout =
    requested === COURSE_SELLER_PREVIEW || requested.startsWith(`${COURSE_SELLER_PREVIEW}-`);
  const state = courseSellerLayout
    ? requested === COURSE_SELLER_PREVIEW
      ? "course-seller-index"
      : requested.slice(`${COURSE_SELLER_PREVIEW}-`.length)
    : requested;
  const model = courseSellerLayout
    ? "course_seller"
    : modelFrom(typeof searchParams.model === "string" ? searchParams.model : undefined);
  const courseSellerRecordLinks = {
    attention: courseSellerPreviewHref("attention-detail", "course-seller-"),
    task: courseSellerPreviewHref("task-form", "course-seller-"),
  };
  const courseSellerModuleLinks = {
    attention: courseSellerPreviewHref("attention", "course-seller-"),
    tasks: courseSellerPreviewHref("tasks", "course-seller-"),
    leads: courseSellerPreviewHref("leads", "course-seller-"),
  };
  const long = state === "long";
  const orgName = courseSellerLayout
    ? long
      ? "Example course seller organization with a display name that wraps on a narrow screen"
      : "Example course seller layout"
    : long
      ? "Example organization with a display name that wraps on a narrow screen"
      : "Example north line";
  const visibility = operatingModelNavVisibility(model);
  const loading = state === "loading";
  const shell = {
    activeNav: "home" as const,
    navigationPresentation: loading ? "pending" as const : "resolved" as const,
    moduleNavVisibility: visibility,
    organizationOptions: loading
      ? []
      : [
          { organizationId: ORG, role: "owner" as const, displayName: orgName },
          {
            organizationId: OTHER,
            role: "admin" as const,
            displayName: "Example second workspace",
          },
        ],
    selectedOrganizationId: loading ? undefined : ORG,
    organizationSelectorAction: courseSellerLayout
      ? `/ad02-preview?state=${requested}`
      : "/ad02-preview",
  };
  const show = (content: ReactNode) =>
    courseSellerLayout ? (
      <>
        <p className={styles.previewBanner} role="note">
          Local simulated QA preview for course_seller. Not a signed-in workspace and not a runtime access test.
        </p>
        {content}
      </>
    ) : (
      content
    );

  if (state === "course-seller-index") {
    const href = (previewState: string) => courseSellerPreviewHref(previewState, `${COURSE_SELLER_PREVIEW}-`);
    return show(
      <AppShellChrome {...shell} activeNav="home">
        <div className={styles.feature}>
          <h1>Course seller layout preview</h1>
          <p>Synthetic local screens for empty and filled course_seller navigation. No organization or database record is created.</p>
          <ul>
            <li><a href={href("empty")}>Home empty</a></li>
            <li><a href={href("populated")}>Home filled</a></li>
            <li><a href={href("long")}>Home long names</a></li>
            <li><a href={href("leads-empty")}>Leads empty</a></li>
            <li><a href={href("leads")}>Leads filled</a></li>
            <li><a href={href("leads-long")}>Leads long names</a></li>
            <li><a href={href("customers-empty")}>Customers empty</a></li>
            <li><a href={href("customers")}>Customers filled</a></li>
            <li><a href={href("customers-long")}>Customers long names</a></li>
            <li><a href={href("program-empty")}>Programs empty</a></li>
            <li><a href={href("program-list")}>Programs filled</a></li>
            <li><a href={href("program-long")}>Programs long names</a></li>
            <li><a href={href("enrollment-empty")}>Enrollments empty</a></li>
            <li><a href={href("enrollment-list")}>Enrollments filled</a></li>
            <li><a href={href("enrollment-long")}>Enrollments long names</a></li>
            <li><a href={href("progress-empty")}>Progress empty</a></li>
            <li><a href={href("progress-list")}>Progress filled</a></li>
            <li><a href={href("progress-long")}>Progress long names</a></li>
            <li><a href={href("attention-empty")}>Attention empty</a></li>
            <li><a href={href("attention")}>Attention filled</a></li>
            <li><a href={href("tasks-empty")}>Tasks empty</a></li>
            <li><a href={href("tasks")}>Tasks filled</a></li>
            <li><a href={href("member-empty")}>Members empty invitations</a></li>
            <li><a href={href("member-list")}>Members filled</a></li>
          </ul>
        </div>
      </AppShellChrome>,
    );
  }

  if (state.startsWith("customer") || state.startsWith("lead")) {
    return show(<Ad03RecordsPreview state={state} orgName={orgName} model={model} statePrefix={courseSellerLayout ? "course-seller-" : ""} />);
  }

  if (state.startsWith("task") || state.startsWith("attention")) {
    return show(<Ad04RecordsPreview state={state} orgName={orgName} model={model} statePrefix={courseSellerLayout ? "course-seller-" : ""} />);
  }

  if (
    state.startsWith("program") ||
    state.startsWith("enrollment") ||
    state.startsWith("progress")
  ) {
    return show(<Ad05RecordsPreview state={state} orgName={orgName} model={model} statePrefix={courseSellerLayout ? "course-seller-" : ""} />);
  }

  if (
    state.startsWith("job") ||
    state.startsWith("site") ||
    state.startsWith("work") ||
    state.startsWith("dispatch")
  ) {
    return show(<Ad07RecordsPreview state={state} orgName={orgName} />);
  }

  if (
    state.startsWith("product") ||
    state.startsWith("order") ||
    state.startsWith("inventory") ||
    state.startsWith("fulfillment")
  ) {
    return show(<Ad08RecordsPreview state={state} orgName={orgName} />);
  }

  if (state.startsWith("project")) {
    return show(<Ad06RecordsPreview state={state} orgName={orgName} model={model} />);
  }

  if (state.startsWith("member")) {
    return show(<Ad09RecordsPreview state={state} orgName={orgName} statePrefix={courseSellerLayout ? "course-seller-" : ""} />);
  }

  if (state.startsWith("social")) {
    return show(<Ad10RecordsPreview state={state} orgName={orgName} />);
  }

  if (state.startsWith("operator")) {
    return show(<Ad11RecordsPreview state={state} orgName={orgName} />);
  }

  if (state.startsWith("access-")) {
    return show(<Ad12RecordsPreview state={state} />);
  }

  if (state.startsWith("gap-")) {
    return show(<Ad13GapPreview state={state} />);
  }

  if (state === "feature") {
    return show(
      <AppShellChrome {...shell} activeNav="home">
        <div className={styles.feature}>
          <p>Component reference. Shared controls use their default light variant.</p>
          <h1>Example records for a long workspace heading</h1>
          <form className={styles.referenceForm}>
            <label htmlFor="example-name">Example name</label>
            <Input id="example-name" name="exampleName" defaultValue={orgName} />
            <Button type="button">Example save</Button>
          </form>
          <Alert title="Example notice" variant="info">
            Example status stays on the default light alert.
          </Alert>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Example record</th>
                  <th scope="col">Example status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{orgName}</td>
                  <td>Example open</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </AppShellChrome>
    );
  }

  return show(
    <AppShellChrome {...shell}>
      {state === "loading" ? (
        <section className={loadingStyles.loading} data-home-surface="" aria-busy="true">
          <h1 className={loadingStyles.title}>Today</h1>
          <p className={loadingStyles.subtitle}>{DAILY_OPERATING_TODAY_SUBTITLE}</p>
          <p className={loadingStyles.message}>Loading today’s brief…</p>
          <div className={loadingStyles.skeleton} aria-hidden="true">
            <div className={loadingStyles.block} />
            <div className={loadingStyles.block} />
            <div className={loadingStyles.block} />
            <div className={loadingStyles.block} />
          </div>
        </section>
      ) : (
        <div className={homeStyles.page} data-home-surface="">
          <header className={homeStyles.pageHeader}>
            <p className={homeStyles.kicker}>{orgName} · Owner</p>
            <h1>Today</h1>
            <p className={homeStyles.subtitle}>{DAILY_OPERATING_TODAY_SUBTITLE}</p>
          </header>
          <DailyOperatingBriefPanel
            brief={
              state === "empty"
                ? {
                    ...exampleBrief(false, courseSellerLayout ? courseSellerRecordLinks : undefined),
                    organizationAttention: [],
                    myAttention: [],
                    overdueTasks: [],
                    dueTodayTasks: [],
                    hasAnyActionable: false,
                  }
                : exampleBrief(long, courseSellerLayout ? courseSellerRecordLinks : undefined)
            }
            attentionQueryFailed={state === "error"}
            tasksQueryFailed={state === "error"}
            moduleNavVisibility={visibility}
            previewModuleHrefs={courseSellerLayout ? courseSellerModuleLinks : undefined}
          />
        </div>
      )}
    </AppShellChrome>
  );
}
