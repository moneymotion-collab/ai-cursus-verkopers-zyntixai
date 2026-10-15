import { Alert } from "@/components/ui/alert";
import { AppShellChrome } from "@/components/app-shell-chrome";
import { Pagination } from "@/components/ui/pagination";
import enrollmentPageStyles from "@/app/(authenticated)/enrollments/page.module.css";
import leadsLoadingStyles from "@/app/(authenticated)/leads/loading.module.css";
import programDetailLoadingStyles from "@/app/(authenticated)/programs/[programId]/loading.module.css";
import programErrorStyles from "@/app/(authenticated)/programs/error.module.css";
import programLoadingStyles from "@/app/(authenticated)/programs/loading.module.css";
import programPageStyles from "@/app/(authenticated)/programs/page.module.css";
import progressErrorStyles from "@/app/(authenticated)/progress/error.module.css";
import progressLoadingStyles from "@/app/(authenticated)/progress/loading.module.css";
import progressPageStyles from "@/app/(authenticated)/progress/page.module.css";
import type { EnrollmentListOperationalHints } from "@/features/enrollments/domain/operational-metadata";
import type { EnrollmentDetailReadModel, EnrollmentListItemReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentPermissionSet } from "@/features/enrollments/domain/types";
import { EnrollmentArchiveForm } from "@/features/enrollments/ui/enrollment-archive-form";
import { EnrollmentCreateForm } from "@/features/enrollments/ui/enrollment-create-form";
import { EnrollmentDetail, EnrollmentUnavailableDetail } from "@/features/enrollments/ui/enrollment-detail";
import { EnrollmentListFilters } from "@/features/enrollments/ui/enrollment-list-filters";
import { EnrollmentListPresentation } from "@/features/enrollments/ui/enrollment-list";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import { EnrollmentOwnerForm } from "@/features/enrollments/ui/enrollment-owner-form";
import { EnrollmentRestoreForm } from "@/features/enrollments/ui/enrollment-restore-form";
import { EnrollmentStatusForm } from "@/features/enrollments/ui/enrollment-status-form";
import type { EnrollmentDetailViewModel } from "@/features/enrollments/ui/load-enrollment-detail-page";
import { courseSellerPreviewHref } from "@/dev/ad02-preview-access";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import type { ProgramDetailReadModel, ProgramListItemReadModel } from "@/features/programs/domain/read-types";
import type { ProgramPermissionSet } from "@/features/programs/domain/types";
import { ProgramArchiveForm } from "@/features/programs/ui/program-archive-form";
import { ProgramCreateForm } from "@/features/programs/ui/program-create-form";
import { ProgramDetail, ProgramUnavailableDetail } from "@/features/programs/ui/program-detail";
import { ProgramEditForm } from "@/features/programs/ui/program-edit-form";
import { ProgramListFilters } from "@/features/programs/ui/program-list-filters";
import { ProgramListPresentation } from "@/features/programs/ui/program-list";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import { ProgramRestoreForm } from "@/features/programs/ui/program-restore-form";
import { ProgramStatusForm } from "@/features/programs/ui/program-status-form";
import type { ProgramDetailViewModel } from "@/features/programs/ui/load-program-detail-page";
import type { ProgressFactDetailReadModel, ProgressFactListItemReadModel } from "@/features/progress/domain/read-types";
import { ProgressCorrectForm } from "@/features/progress/ui/progress-correct-form";
import { ProgressDetail, ProgressUnavailableDetail } from "@/features/progress/ui/progress-detail";
import { ProgressListFilters } from "@/features/progress/ui/progress-list-filters";
import { ProgressListPresentation } from "@/features/progress/ui/progress-list";
import type { ProgressListUrlState } from "@/features/progress/ui/progress-list-search-params";
import { ProgressRecordForm } from "@/features/progress/ui/progress-record-form";
import { ProgressVoidForm } from "@/features/progress/ui/progress-void-form";
import type { ProgressDetailViewModel } from "@/features/progress/ui/load-progress-detail-page";

const ORG = "11111111-1111-4111-8111-111111111111";
const LONG_NAME =
  "AD05 example program with a name that wraps across a narrow authenticated screen";
const LONG_EMAIL = "ad05.example.participant.with.a.very.long.address@example.test";
const LONG_LABEL =
  "AD05 example customer with a display label that wraps on a narrow screen";

const programListState: ProgramListUrlState = {
  org: ORG,
  archived: false,
  sort: "updated_at",
  direction: "desc",
  page: 1,
  pageSize: 25,
};

const enrollmentListState: EnrollmentListUrlState = {
  org: ORG,
  archived: false,
  sort: "enrolled_at",
  direction: "desc",
  page: 1,
  pageSize: 25,
};

const progressListState: ProgressListUrlState = {
  org: ORG,
  includeVoided: false,
  sort: "occurred_at",
  direction: "desc",
  page: 1,
  pageSize: 25,
};

const programPermissions: ProgramPermissionSet = {
  canListPrograms: true,
  canViewProgram: true,
  canViewArchivedPrograms: true,
  canCreateProgram: true,
  canUpdateProgram: true,
  canTransitionProgramStatus: true,
  canArchiveProgram: true,
  canRestoreProgram: true,
  canViewProgramHistory: true,
};

const enrollmentPermissions: EnrollmentPermissionSet = {
  canListEnrollments: true,
  canViewEnrollment: true,
  canViewArchivedEnrollments: true,
  canCreateEnrollment: true,
  canUpdateOwnerOrMetadata: true,
  canTransitionEnrollmentStatus: true,
  canArchiveEnrollment: true,
  canRestoreEnrollment: true,
  canViewEnrollmentHistory: true,
};

function programItem(long: boolean, archived = false): ProgramListItemReadModel {
  return {
    id: archived ? "example-program-archived" : "example-program-1",
    organizationId: ORG,
    name: long ? LONG_NAME : "AD05 example program",
    status: archived ? "retired" : "active",
    statusLabel: archived ? "Retired" : "Active",
    deliveryMode: "cohort",
    deliveryModeLabel: "Cohort",
    openEnrollmentCount: 2,
    updatedAt: "2026-10-02T09:00:00.000Z",
    createdAt: "2026-10-01T09:00:00.000Z",
    archivedAt: archived ? "2026-10-03T09:00:00.000Z" : null,
    derived: { isArchived: archived },
  };
}

function programDetail(long: boolean, archived = false): ProgramDetailReadModel {
  const item = programItem(long, archived);
  return {
    ...item,
    description: long
      ? "AD05 example description that stays inside the form on a narrow screen."
      : "AD05 example description",
    createdByMemberId: "example-owner",
    derived: {
      isArchived: archived,
      allowedTransitions: archived ? [] : ["paused", "retired"],
    },
  };
}

function programView(long: boolean, archived = false): ProgramDetailViewModel {
  return {
    program: programDetail(long, archived),
    permissions: programPermissions,
    history: [],
    historyState: { kind: "empty" },
    descriptionLabel: programDetail(long, archived).description ?? "",
    organizationTimezone: "Europe/Amsterdam",
    backHref: "/ad02-preview?state=program-list",
  };
}

function enrollmentItem(long: boolean, archived = false): EnrollmentListItemReadModel {
  return {
    id: archived ? "example-enrollment-archived" : "example-enrollment-1",
    organizationId: ORG,
    customerId: "example-customer",
    programId: "example-program-1",
    customerDisplayName: long ? `${LONG_LABEL} <${LONG_EMAIL}>` : "AD05 example customer",
    programName: long ? LONG_NAME : "AD05 example program",
    status: archived ? "cancelled" : "active",
    statusLabel: archived ? "Cancelled" : "Active",
    ownerMemberId: "example-owner",
    enrolledAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
    archivedAt: archived ? "2026-10-03T09:00:00.000Z" : null,
    derived: { isArchived: archived, isOpen: !archived, isTerminal: archived },
  };
}

function enrollmentDetail(long: boolean, archived = false): EnrollmentDetailReadModel {
  const item = enrollmentItem(long, archived);
  return {
    ...item,
    createdByMemberId: "example-owner",
    startedAt: "2026-10-01T09:00:00.000Z",
    completedAt: null,
    cancelledAt: archived ? "2026-10-03T09:00:00.000Z" : null,
    source: "manual",
    metadata: {},
    createdAt: "2026-10-01T09:00:00.000Z",
    customer: {
      id: "example-customer",
      displayName: item.customerDisplayName ?? "AD05 example customer",
      status: "active",
      archivedAt: null,
    },
    program: {
      id: "example-program-1",
      name: item.programName ?? "AD05 example program",
      status: "active",
      archivedAt: null,
    },
    derived: {
      isArchived: archived,
      isOpen: !archived,
      isTerminal: archived,
      allowedTransitions: archived ? [] : ["paused", "completed", "cancelled"],
    },
  };
}

function enrollmentView(long: boolean, archived = false): EnrollmentDetailViewModel {
  return {
    enrollment: enrollmentDetail(long, archived),
    permissions: enrollmentPermissions,
    history: [],
    historyState: { kind: "empty" },
    ownerLabel: long ? LONG_LABEL : "AD05 example owner",
    sourceLabel: "Manual",
    organizationTimezone: "Europe/Amsterdam",
    backHref: "/ad02-preview?state=enrollment-list",
    customerLabel: long ? LONG_LABEL : "AD05 example customer",
    programLabel: long ? LONG_NAME : "AD05 example program",
    customerHref: "/ad02-preview?state=feature",
    programHref: "/ad02-preview?state=program-detail",
    operational: {
      enrollmentId: "example-enrollment-1",
      organizationId: ORG,
      progress: {
        nonVoidedFactCount: 1,
        latest: {
          factId: "example-progress-1",
          title: "AD05 example milestone",
          factType: "milestone_reached",
          factTypeLabel: "Milestone reached",
          occurredAt: "2026-10-02T09:00:00.000Z",
        },
        progressReferenceAt: "2026-10-02T09:00:00.000Z",
        ageCalendarDays: 5,
        health: "healthy",
        healthLabel: "Progress current",
        staleEligible: true,
        stale: false,
      },
      attention: { openCount: 0, items: [] },
      nextAction: null,
    },
  };
}

const enrollmentHints: EnrollmentListOperationalHints = {
  byEnrollmentId: {
    "example-enrollment-1": {
      latestProgressOccurredAt: "2026-10-02T09:00:00.000Z",
      latestProgressTitle: "AD05 example milestone",
      health: "healthy",
      healthLabel: "Progress current",
      openAttentionCount: 1,
      highestOpenAttentionSeverity: "high",
    },
  },
};

function progressItem(long: boolean, voided = false): ProgressFactListItemReadModel {
  return {
    id: voided ? "example-progress-voided" : "example-progress-1",
    organizationId: ORG,
    enrollmentId: "example-enrollment-1",
    customerId: "example-customer",
    programId: "example-program-1",
    factType: "milestone_reached",
    factTypeLabel: "Milestone reached",
    source: "manual",
    sourceLabel: "Manual",
    title: long ? LONG_NAME : "AD05 example milestone",
    occurredAt: "2026-10-02T09:00:00.000Z",
    recordedAt: "2026-10-02T10:00:00.000Z",
    recordedByMemberId: "example-owner",
    voidedAt: voided ? "2026-10-03T09:00:00.000Z" : null,
    customerDisplayName: long ? LONG_LABEL : "AD05 example customer",
    programName: long ? LONG_NAME : "AD05 example program",
    derived: {
      isVoided: voided,
      isCorrection: false,
      isManual: true,
      hasActiveLineagePredecessor: false,
    },
  };
}

function progressDetail(long: boolean): ProgressFactDetailReadModel {
  const item = progressItem(long);
  return {
    ...item,
    description: "AD05 example progress note",
    numericValue: 1,
    numericUnit: "module",
    isComplete: false,
    sequenceNumber: 1,
    idempotencyKey: null,
    correctedFromFactId: null,
    voidedByMemberId: null,
    voidReason: null,
    enrollment: {
      id: "example-enrollment-1",
      status: "active",
      archivedAt: null,
      customerId: "example-customer",
      programId: "example-program-1",
    },
    customer: {
      id: "example-customer",
      displayName: item.customerDisplayName ?? "AD05 example customer",
      status: "active",
      archivedAt: null,
    },
    program: {
      id: "example-program-1",
      name: item.programName ?? "AD05 example program",
      status: "active",
      archivedAt: null,
    },
  };
}

function progressView(long: boolean): ProgressDetailViewModel {
  return {
    fact: progressDetail(long),
    titleLabel: long ? LONG_NAME : "AD05 example milestone",
    customerLabel: long ? `${LONG_LABEL} <${LONG_EMAIL}>` : "AD05 example customer",
    programLabel: long ? LONG_NAME : "AD05 example program",
    enrollmentStatusLabel: "Active",
    enrollmentArchived: false,
    recorderLabel: long ? LONG_LABEL : "AD05 example owner",
    voidedByLabel: null,
    occurredAtLabel: "Oct 2, 2026, 11:00 AM",
    recordedAtLabel: "Oct 2, 2026, 12:00 PM",
    voidedAtLabel: null,
    customerHref: "/ad02-preview?state=feature",
    programHref: "/ad02-preview?state=program-detail",
    enrollmentHref: "/ad02-preview?state=enrollment-detail",
    correctedFromHref: null,
    backHref: "/ad02-preview?state=progress-list",
    organizationTimezone: "Europe/Amsterdam",
  };
}

const longOption = {
  value: "example-long",
  label: `${LONG_LABEL} <${LONG_EMAIL}>`,
  status: "active",
};

export function Ad05RecordsPreview({
  state,
  orgName,
  model,
  statePrefix = "",
}: {
  state: string;
  orgName: string;
  model: OperatingModelId;
  statePrefix?: string;
}) {
  const activeNav = state.startsWith("enrollment")
    ? "enrollments"
    : state.startsWith("progress")
      ? "progress"
      : "programs";
  const long = state.endsWith("long");
  const previewHref = (name: string) => courseSellerPreviewHref(name, statePrefix);

  return (
    <AppShellChrome
      activeNav={activeNav}
      moduleNavVisibility={operatingModelNavVisibility(model)}
      organizationOptions={[
        { organizationId: ORG, role: "owner", displayName: orgName },
        {
          organizationId: "22222222-2222-4222-8222-222222222222",
          role: "admin",
          displayName: "Example second workspace",
        },
      ]}
      selectedOrganizationId={ORG}
      organizationSelectorAction="/ad02-preview"
    >
      {state === "program-loading" ? (
        <section className={programLoadingStyles.loading} aria-busy="true">
          <h1 className={programLoadingStyles.title}>Programs</h1>
          <p className={programLoadingStyles.message}>Loading programs…</p>
          <div className={programLoadingStyles.tableSkeleton} aria-hidden="true">
            <div className={programLoadingStyles.row} />
          </div>
        </section>
      ) : null}
      {state === "program-detail-loading" ? (
        <section className={programDetailLoadingStyles.loading} aria-busy="true">
          <h1 className={programDetailLoadingStyles.title}>Program</h1>
          <p className={programDetailLoadingStyles.message}>Loading program…</p>
          <div className={programDetailLoadingStyles.skeleton} aria-hidden="true" />
        </section>
      ) : null}
      {state === "program-error" ? (
        <section className={programErrorStyles.errorPanel}>
          <h1>Something went wrong</h1>
          <Alert title="Unable to display programs" variant="error">
            An unexpected error occurred while loading the programs page. Please try again.
          </Alert>
          <button type="button" className={programErrorStyles.retryButton}>
            Try again
          </button>
        </section>
      ) : null}
      {state === "program-query" ? (
        <section className={programPageStyles.page}>
          <h1>Programs</h1>
          <Alert title="Unable to load programs" variant="error">
            AD05 example query message
          </Alert>
        </section>
      ) : null}
      {state === "program-list" || state === "program-long" || state === "program-empty" ? (
        <section className={programPageStyles.page}>
          <header className={programPageStyles.pageHeader}>
            <div className={programPageStyles.pageHeaderRow}>
              <h1>Programs</h1>
              <a className={programPageStyles.newProgramLink} href={previewHref("program-new")}>
                New program
              </a>
            </div>
            <p className={programPageStyles.subtitle}>
              Program workspace for {orgName}. Times shown in Europe/Amsterdam.
            </p>
            <p className={programPageStyles.summary}>
              Showing {state === "program-empty" ? 0 : 2} of {state === "program-empty" ? 0 : 2} programs
            </p>
          </header>
          <ProgramListFilters urlState={programListState} role="owner" />
          <ProgramListPresentation
            programs={
              state === "program-empty"
                ? []
                : [programItem(long), programItem(false, true)]
            }
            timeZone="Europe/Amsterdam"
            listState={programListState}
            emptyTitle="No programs yet"
            emptyDescription="Create a program to start enrolling customers."
            createHref={previewHref("program-new")}
          />
          <Pagination
            page={1}
            totalPages={2}
            previousHref={undefined}
            nextHref={previewHref("program-list")}
            ariaLabel="Program list pagination"
          />
        </section>
      ) : null}
      {state === "program-detail" || state === "program-detail-long" ? (
        <ProgramDetail
          viewModel={programView(state.endsWith("long"))}
          workflowLinks={{
            edit: "/ad02-preview?state=program-edit",
            status: "/ad02-preview?state=program-status",
            archive: "/ad02-preview?state=program-archive",
          }}
          enrollmentLinks={{
            viewEnrollmentsHref: "/ad02-preview?state=enrollment-list",
            createEnrollmentHref: "/ad02-preview?state=enrollment-new",
          }}
          progressLinks={{ viewProgressHref: "/ad02-preview?state=progress-list" }}
        />
      ) : null}
      {state === "program-unavailable" ? (
        <ProgramUnavailableDetail backHref="/ad02-preview?state=program-list" />
      ) : null}
      {state === "program-new" || state === "program-new-errors" || state === "program-new-pending" ? (
        <ProgramCreateForm
          organizationId={ORG}
          listState={programListState}
          cancelHref={previewHref("program-list")}
          initialUiState={
            state === "program-new-pending"
              ? { kind: "pending" }
              : state === "program-new-errors"
                ? {
                    kind: "field_error",
                    fieldErrors: { name: ["Name is required"] },
                    message: "Please correct the highlighted fields and try again.",
                  }
                : { kind: "idle" }
          }
        />
      ) : null}
      {state === "program-edit" || state === "program-edit-long" ? (
        <ProgramEditForm
          organizationId={ORG}
          program={programDetail(state.endsWith("long"))}
          listState={programListState}
          cancelHref="/ad02-preview?state=program-detail"
        />
      ) : null}
      {state === "program-status" ? (
        <ProgramStatusForm
          organizationId={ORG}
          program={programDetail(false)}
          allowedTargets={["paused", "retired"]}
          listState={programListState}
          cancelHref="/ad02-preview?state=program-detail"
        />
      ) : null}
      {state === "program-archive" ? (
        <ProgramArchiveForm
          organizationId={ORG}
          program={programDetail(true)}
          listState={programListState}
          backHref="/ad02-preview?state=program-detail"
        />
      ) : null}
      {state === "program-archive-pending" ? (
        <section>
          <h1>Archive program</h1>
          <p role="status">Archive is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "program-restore" ? (
        <ProgramRestoreForm
          organizationId={ORG}
          program={programDetail(false, true)}
          listState={programListState}
          backHref="/ad02-preview?state=program-detail"
        />
      ) : null}

      {state === "enrollment-loading" ? (
        <section className={leadsLoadingStyles.loading} aria-busy="true">
          <h1 className={leadsLoadingStyles.title}>Enrollments</h1>
          <p className={leadsLoadingStyles.message}>Loading enrollments…</p>
          <ul className={leadsLoadingStyles.cardSkeleton} aria-hidden="true">
            <li className={leadsLoadingStyles.card} />
          </ul>
        </section>
      ) : null}
      {state === "enrollment-query" ? (
        <section className={enrollmentPageStyles.page}>
          <h1>Enrollments</h1>
          <Alert title="Unable to load enrollments" variant="error">
            AD05 example query message
          </Alert>
        </section>
      ) : null}
      {state === "enrollment-list" || state === "enrollment-long" || state === "enrollment-empty" ? (
        <section className={enrollmentPageStyles.page}>
          <header className={enrollmentPageStyles.pageHeader}>
            <div className={enrollmentPageStyles.pageHeaderRow}>
              <h1>Enrollments</h1>
              <a className={enrollmentPageStyles.newEnrollmentLink} href={previewHref("enrollment-new")}>
                New enrollment
              </a>
            </div>
            <p className={enrollmentPageStyles.subtitle}>
              Enrollment workspace for {orgName}. Times shown in Europe/Amsterdam.
            </p>
            <p className={enrollmentPageStyles.summary}>
              Showing {state === "enrollment-empty" ? 0 : 1} of {state === "enrollment-empty" ? 0 : 1} enrollments
            </p>
          </header>
          <p className={enrollmentPageStyles.contextBanner} role="status">
            Showing enrollments for the selected program context.{" "}
            <a href={previewHref("enrollment-list")}>Clear context</a>
          </p>
          <EnrollmentListFilters urlState={enrollmentListState} role="owner" />
          <EnrollmentListPresentation
            enrollments={state === "enrollment-empty" ? [] : [enrollmentItem(long)]}
            timeZone="Europe/Amsterdam"
            listState={enrollmentListState}
            ownerLabels={{ "example-owner": long ? LONG_LABEL : "AD05 example owner" }}
            operationalHints={enrollmentHints}
            emptyTitle="No enrollments yet"
            emptyDescription="Enroll a customer in a program to track progress."
            createHref={previewHref("enrollment-new")}
          />
          <Pagination
            page={1}
            totalPages={2}
            nextHref={previewHref("enrollment-list")}
            ariaLabel="Enrollment list pagination"
          />
        </section>
      ) : null}
      {state === "enrollment-detail" || state === "enrollment-detail-long" ? (
        <EnrollmentDetail
          viewModel={enrollmentView(state.endsWith("long"))}
          workflowLinks={{
            edit: "/ad02-preview?state=enrollment-edit",
            status: "/ad02-preview?state=enrollment-status",
            archive: "/ad02-preview?state=enrollment-archive",
          }}
          progressLinks={{
            viewProgressHref: "/ad02-preview?state=progress-list",
            recordProgressHref: "/ad02-preview?state=progress-new",
          }}
        />
      ) : null}
      {state === "enrollment-unavailable" ? (
        <EnrollmentUnavailableDetail backHref="/ad02-preview?state=enrollment-list" />
      ) : null}
      {state === "enrollment-new" || state === "enrollment-new-errors" || state === "enrollment-new-pending" ? (
        <EnrollmentCreateForm
          organizationId={ORG}
          listState={enrollmentListState}
          cancelHref={previewHref("enrollment-list")}
          customers={[longOption, { value: "example-customer", label: "AD05 example customer", status: "active" }]}
          programs={[{ value: "example-program-1", label: LONG_NAME }]}
          members={[{ value: "example-owner", label: LONG_LABEL }]}
          initialUiState={
            state === "enrollment-new-pending"
              ? { kind: "pending" }
              : state === "enrollment-new-errors"
                ? {
                    kind: "field_error",
                    fieldErrors: { customerId: ["Customer is required"] },
                    message: "Please correct the highlighted fields and try again.",
                  }
                : { kind: "idle" }
          }
        />
      ) : null}
      {state === "enrollment-edit" ? (
        <EnrollmentOwnerForm
          organizationId={ORG}
          enrollment={enrollmentDetail(true)}
          members={[{ value: "example-owner", label: LONG_LABEL }]}
          listState={enrollmentListState}
          cancelHref="/ad02-preview?state=enrollment-detail"
        />
      ) : null}
      {state === "enrollment-status" ? (
        <EnrollmentStatusForm
          organizationId={ORG}
          enrollment={enrollmentDetail(false)}
          allowedTargets={["paused", "completed", "cancelled"]}
          listState={enrollmentListState}
          cancelHref="/ad02-preview?state=enrollment-detail"
        />
      ) : null}
      {state === "enrollment-archive" ? (
        <EnrollmentArchiveForm
          organizationId={ORG}
          enrollment={enrollmentDetail(true, true)}
          listState={enrollmentListState}
          backHref="/ad02-preview?state=enrollment-detail"
        />
      ) : null}
      {state === "enrollment-restore" ? (
        <EnrollmentRestoreForm
          organizationId={ORG}
          enrollment={enrollmentDetail(false, true)}
          listState={enrollmentListState}
          backHref="/ad02-preview?state=enrollment-detail"
        />
      ) : null}

      {state === "progress-loading" ? (
        <section className={progressLoadingStyles.loading} aria-busy="true">
          <h1 className={progressLoadingStyles.title}>Progress</h1>
          <p className={progressLoadingStyles.message}>Loading progress…</p>
          <div className={progressLoadingStyles.tableSkeleton} aria-hidden="true">
            <div className={progressLoadingStyles.row} />
          </div>
        </section>
      ) : null}
      {state === "progress-error" ? (
        <section className={progressErrorStyles.errorPanel}>
          <h1>Something went wrong</h1>
          <Alert title="Unable to display progress" variant="error">
            An unexpected error occurred while loading the progress page. Please try again.
          </Alert>
          <button type="button" className={progressErrorStyles.retryButton}>
            Try again
          </button>
        </section>
      ) : null}
      {state === "progress-query" ? (
        <section className={progressPageStyles.page}>
          <h1>Progress</h1>
          <Alert title="Unable to load progress" variant="error">
            AD05 example query message
          </Alert>
        </section>
      ) : null}
      {state === "progress-list" || state === "progress-long" || state === "progress-empty" ? (
        <section className={progressPageStyles.page}>
          <header className={progressPageStyles.pageHeader}>
            <div className={progressPageStyles.pageHeaderRow}>
              <h1>Progress</h1>
              <a className={progressPageStyles.recordLink} href={previewHref("progress-new")}>
                Record progress
              </a>
            </div>
            <p className={progressPageStyles.subtitle}>
              Progress workspace for {orgName}. Times shown in Europe/Amsterdam.
            </p>
            <p className={progressPageStyles.summary}>
              Showing {state === "progress-empty" ? 0 : 1} of {state === "progress-empty" ? 0 : 1} progress records
            </p>
          </header>
          <p className={progressPageStyles.contextBanner} role="status">
            Showing progress for the selected enrollment, customer, or program context.{" "}
            <a href={previewHref("progress-list")}>Clear context</a>
          </p>
          <ProgressListFilters urlState={progressListState} role="owner" />
          <ProgressListPresentation
            facts={state === "progress-empty" ? [] : [progressItem(long)]}
            timeZone="Europe/Amsterdam"
            listState={progressListState}
            recorderLabels={{ "example-owner": long ? LONG_LABEL : "AD05 example owner" }}
            emptyTitle="No progress yet"
            emptyDescription="Record progress against an enrollment."
          />
          <Pagination
            page={1}
            totalPages={2}
            nextHref={previewHref("progress-list")}
            ariaLabel="Progress list pagination"
          />
        </section>
      ) : null}
      {state === "progress-detail" || state === "progress-detail-long" ? (
        <ProgressDetail
          viewModel={progressView(state.endsWith("long"))}
          workflowLinks={{
            record: "/ad02-preview?state=progress-new",
            correct: "/ad02-preview?state=progress-correct",
            void: "/ad02-preview?state=progress-void",
          }}
        />
      ) : null}
      {state === "progress-unavailable" ? (
        <ProgressUnavailableDetail backHref="/ad02-preview?state=progress-list" />
      ) : null}
      {state === "progress-new" || state === "progress-new-errors" || state === "progress-new-pending" ? (
        <ProgressRecordForm
          organizationId={ORG}
          backHref={previewHref("progress-list")}
          enrollmentOptions={[
            { value: "example-enrollment-1", label: `${LONG_LABEL} — ${LONG_NAME}` },
          ]}
          initialUiState={
            state === "progress-new-pending"
              ? { kind: "pending" }
              : state === "progress-new-errors"
                ? {
                    kind: "field_error",
                    fieldErrors: { title: ["Title is required"] },
                    message: "Please correct the highlighted fields and try again.",
                  }
                : { kind: "idle" }
          }
        />
      ) : null}
      {state === "progress-correct" ? (
        <ProgressCorrectForm
          organizationId={ORG}
          data={progressView(true)}
          backHref="/ad02-preview?state=progress-detail"
        />
      ) : null}
      {state === "progress-void" ? (
        <ProgressVoidForm
          organizationId={ORG}
          data={progressView(true)}
          backHref="/ad02-preview?state=progress-detail"
        />
      ) : null}
      {state === "progress-void-pending" ? (
        <section>
          <h1>Void progress</h1>
          <p role="status">Void is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
    </AppShellChrome>
  );
}
