import { Suspense } from "react";
import Link from "next/link";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import styles from "./app-shell.module.css";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  ENROLLMENTS_NAV_LABEL,
  ENROLLMENTS_ROUTE,
} from "@/features/enrollments/domain/enrollments-navigation";
import {
  PROGRESS_NAV_LABEL,
  PROGRESS_ROUTE,
} from "@/features/progress/domain/progress-navigation";
import {
  ATTENTION_NAV_LABEL,
  ATTENTION_ROUTE,
} from "@/features/attention/domain/attention-navigation";
import {
  MEMBERS_NAV_LABEL,
  MEMBERS_ROUTE,
  resolveMembersNavVisible,
} from "@/features/invitations/domain/members-navigation";
import {
  PROGRAMS_NAV_LABEL,
  PROGRAMS_ROUTE,
} from "@/features/programs/domain/programs-navigation";
import { SocialPrimaryNavLink } from "@/features/social-media/ui/social-primary-nav-link";
import {
  CLOSED_BETA_SUPPORT_LABEL,
  resolveClosedBetaSupportMailto,
} from "@/features/support/closed-beta-support-contact";
import type { ModuleNavVisibility } from "@/features/product-access/domain/types";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
  type ProductTerminology,
} from "@/features/product-access/domain/terminology";
import { OrgAwareLink } from "./org-aware-link";

export type AppShellActiveNav =
  | "home"
  | "leads"
  | "customers"
  | "projects"
  | "sites"
  | "workOrders"
  | "dispatch"
  | "programs"
  | "enrollments"
  | "progress"
  | "attention"
  | "social"
  | "tasks"
  | "members";

export type AppShellProps = {
  children: React.ReactNode;
  organizationOptions?: OrganizationOption[];
  selectedOrganizationId?: string;
  organizationSelectorAction?: string;
  /** Authoritative module visibility from resolved organization context. Fail-closed when omitted. */
  moduleNavVisibility?: ModuleNavVisibility;
  /**
   * Display terminology resolved from the same effective context as moduleNavVisibility.
   * Presentation only — never influences navVisibility, route access, or capability checks.
   * Defaults to generic system wording (not a Course Seller-specific fallback) when omitted.
   */
  terminology?: ProductTerminology;
  /**
   * Members nav visibility override.
   * When omitted: fail-closed derivation from organizationOptions[].role.
   * Explicit false: always hide. Explicit true: always show.
   *
   * Presentation only — /settings/members route authorization remains authoritative.
   */
  membersNavVisible?: boolean;
  /**
   * Social nav visibility override for closed-beta enrollment.
   * When omitted: server-derived from selected organization enrollment (fail-closed).
   * Explicit false: always hide. Explicit true: show when Social nav capability is on.
   *
   * Presentation only — /social route authorization remains authoritative.
   */
  socialNavVisible?: boolean;
  activeNav?: AppShellActiveNav;
};

function PrimaryNavFallback({
  selectedOrganizationId,
  socialNavVisible,
  showMembersNav,
  moduleNavVisibility,
  terminology,
  activeNav,
}: {
  selectedOrganizationId?: string;
  socialNavVisible?: boolean;
  showMembersNav: boolean;
  moduleNavVisibility: ModuleNavVisibility;
  terminology: ProductTerminology;
  activeNav: AppShellActiveNav;
}) {
  const withOrg = (path: string) =>
    selectedOrganizationId
      ? `${path}?org=${encodeURIComponent(selectedOrganizationId)}`
      : path;

  return (
    <nav className={styles.nav} aria-label="Primary">
      {moduleNavVisibility.home ? (
        <Link
          className={styles.navLink}
          href={withOrg("/home")}
          aria-current={activeNav === "home" ? "page" : undefined}
        >
          Home
        </Link>
      ) : null}
      {moduleNavVisibility.leads ? (
        <Link
          className={styles.navLink}
          href={withOrg("/leads")}
          aria-current={activeNav === "leads" ? "page" : undefined}
        >
          Leads
        </Link>
      ) : null}
      {moduleNavVisibility.customers ? (
        <Link
          className={styles.navLink}
          href={withOrg("/customers")}
          aria-current={activeNav === "customers" ? "page" : undefined}
        >
          {terminology.customer.plural}
        </Link>
      ) : null}
      {moduleNavVisibility.projects ? (
        <Link
          className={styles.navLink}
          href={withOrg("/projects")}
          aria-current={activeNav === "projects" ? "page" : undefined}
        >
          {terminology.project.plural}
        </Link>
      ) : null}
      {moduleNavVisibility.sites ? (
        <Link className={styles.navLink} href={withOrg("/sites")} aria-current={activeNav === "sites" ? "page" : undefined}>
          {terminology.site.plural}
        </Link>
      ) : null}
      {moduleNavVisibility.workOrders ? (
        <Link className={styles.navLink} href={withOrg("/work-orders")} aria-current={activeNav === "workOrders" ? "page" : undefined}>
          {terminology.workOrder.plural}
        </Link>
      ) : null}
      {moduleNavVisibility.dispatch ? (
        <Link className={styles.navLink} href={withOrg("/dispatch")} aria-current={activeNav === "dispatch" ? "page" : undefined}>
          Dispatch
        </Link>
      ) : null}
      {moduleNavVisibility.programs ? (
        <Link
          className={styles.navLink}
          href={withOrg(PROGRAMS_ROUTE)}
          aria-current={activeNav === "programs" ? "page" : undefined}
        >
          {PROGRAMS_NAV_LABEL}
        </Link>
      ) : null}
      {moduleNavVisibility.enrollments ? (
        <Link
          className={styles.navLink}
          href={withOrg(ENROLLMENTS_ROUTE)}
          aria-current={activeNav === "enrollments" ? "page" : undefined}
        >
          {ENROLLMENTS_NAV_LABEL}
        </Link>
      ) : null}
      {moduleNavVisibility.progress ? (
        <Link
          className={styles.navLink}
          href={withOrg(PROGRESS_ROUTE)}
          aria-current={activeNav === "progress" ? "page" : undefined}
        >
          {PROGRESS_NAV_LABEL}
        </Link>
      ) : null}
      {moduleNavVisibility.attention ? (
        <Link
          className={styles.navLink}
          href={withOrg(ATTENTION_ROUTE)}
          aria-current={activeNav === "attention" ? "page" : undefined}
        >
          {ATTENTION_NAV_LABEL}
        </Link>
      ) : null}
      <SocialPrimaryNavLink
        selectedOrganizationId={selectedOrganizationId}
        explicitVisibility={socialNavVisible}
        active={activeNav === "social"}
      />
      {moduleNavVisibility.tasks ? (
        <Link
          className={styles.navLink}
          href={withOrg("/tasks")}
          aria-current={activeNav === "tasks" ? "page" : undefined}
        >
          Tasks
        </Link>
      ) : null}
      {showMembersNav && moduleNavVisibility.members ? (
        <Link
          className={styles.navLink}
          href={withOrg(MEMBERS_ROUTE)}
          aria-current={activeNav === "members" ? "page" : undefined}
        >
          {MEMBERS_NAV_LABEL}
        </Link>
      ) : null}
    </nav>
  );
}

function PrimaryNav({
  selectedOrganizationId,
  socialNavVisible,
  showMembersNav,
  moduleNavVisibility,
  terminology,
  activeNav,
}: {
  selectedOrganizationId?: string;
  socialNavVisible?: boolean;
  showMembersNav: boolean;
  moduleNavVisibility: ModuleNavVisibility;
  terminology: ProductTerminology;
  activeNav: AppShellActiveNav;
}) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {moduleNavVisibility.home ? (
        <OrgAwareLink
          className={styles.navLink}
          href="/home"
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "home" ? "page" : undefined}
        >
          Home
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.leads ? (
        <OrgAwareLink
          className={styles.navLink}
          href="/leads"
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "leads" ? "page" : undefined}
        >
          Leads
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.customers ? (
        <OrgAwareLink
          className={styles.navLink}
          href="/customers"
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "customers" ? "page" : undefined}
        >
          {terminology.customer.plural}
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.projects ? (
        <OrgAwareLink
          className={styles.navLink}
          href="/projects"
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "projects" ? "page" : undefined}
        >
          {terminology.project.plural}
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.sites ? (
        <OrgAwareLink className={styles.navLink} href="/sites" organizationId={selectedOrganizationId} aria-current={activeNav === "sites" ? "page" : undefined}>
          {terminology.site.plural}
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.workOrders ? (
        <OrgAwareLink className={styles.navLink} href="/work-orders" organizationId={selectedOrganizationId} aria-current={activeNav === "workOrders" ? "page" : undefined}>
          {terminology.workOrder.plural}
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.dispatch ? (
        <OrgAwareLink className={styles.navLink} href="/dispatch" organizationId={selectedOrganizationId} aria-current={activeNav === "dispatch" ? "page" : undefined}>
          Dispatch
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.programs ? (
        <OrgAwareLink
          className={styles.navLink}
          href={PROGRAMS_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "programs" ? "page" : undefined}
        >
          {PROGRAMS_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.enrollments ? (
        <OrgAwareLink
          className={styles.navLink}
          href={ENROLLMENTS_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "enrollments" ? "page" : undefined}
        >
          {ENROLLMENTS_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.progress ? (
        <OrgAwareLink
          className={styles.navLink}
          href={PROGRESS_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "progress" ? "page" : undefined}
        >
          {PROGRESS_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
      {moduleNavVisibility.attention ? (
        <OrgAwareLink
          className={styles.navLink}
          href={ATTENTION_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "attention" ? "page" : undefined}
        >
          {ATTENTION_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
      <SocialPrimaryNavLink
        selectedOrganizationId={selectedOrganizationId}
        explicitVisibility={socialNavVisible}
        active={activeNav === "social"}
      />
      {moduleNavVisibility.tasks ? (
        <OrgAwareLink
          className={styles.navLink}
          href="/tasks"
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "tasks" ? "page" : undefined}
        >
          Tasks
        </OrgAwareLink>
      ) : null}
      {showMembersNav && moduleNavVisibility.members ? (
        <OrgAwareLink
          className={styles.navLink}
          href={MEMBERS_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "members" ? "page" : undefined}
        >
          {MEMBERS_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
    </nav>
  );
}

export function AppShell({
  children,
  organizationOptions = [],
  selectedOrganizationId,
  organizationSelectorAction = "/tasks",
  moduleNavVisibility = FAIL_CLOSED_MODULE_NAV_VISIBILITY,
  terminology = DEFAULT_PRODUCT_TERMINOLOGY,
  membersNavVisible,
  socialNavVisible,
  activeNav = "tasks",
}: AppShellProps) {
  const showOrgSelector = organizationOptions.length > 1;
  const showMembersNav = resolveMembersNavVisible({
    explicitVisibility: membersNavVisible,
    organizationOptions,
    selectedOrganizationId,
  });
  const supportMailto = resolveClosedBetaSupportMailto();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandBlock}>
            <p className={styles.brand}>ZyntixAI</p>
            <Suspense
              fallback={
                <PrimaryNavFallback
                  selectedOrganizationId={selectedOrganizationId}
                  socialNavVisible={socialNavVisible}
                  showMembersNav={showMembersNav}
                  moduleNavVisibility={moduleNavVisibility}
                  terminology={terminology}
                  activeNav={activeNav}
                />
              }
            >
              <PrimaryNav
                selectedOrganizationId={selectedOrganizationId}
                socialNavVisible={socialNavVisible}
                showMembersNav={showMembersNav}
                moduleNavVisibility={moduleNavVisibility}
                terminology={terminology}
                activeNav={activeNav}
              />
            </Suspense>
          </div>
          <div className={styles.headerActions}>
            {showOrgSelector ? (
              <form className={styles.orgForm} method="get" action={organizationSelectorAction}>
                <label className={styles.orgLabel} htmlFor="organization-selector">
                  Organization
                </label>
                <select
                  id="organization-selector"
                  name="org"
                  className={styles.orgSelect}
                  defaultValue={selectedOrganizationId}
                  aria-label="Select organization"
                >
                  {organizationOptions.map((option) => (
                    <option key={option.organizationId} value={option.organizationId}>
                      {option.displayName}
                    </option>
                  ))}
                </select>
                <button type="submit" className={styles.orgSubmit}>
                  Switch
                </button>
              </form>
            ) : null}
            <form action={logoutAction} className={styles.logoutForm}>
              <button type="submit" className={styles.logoutButton}>
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      {supportMailto ? (
        <footer className={styles.footer}>
          <a className={styles.supportLink} href={supportMailto}>
            {CLOSED_BETA_SUPPORT_LABEL}
          </a>
        </footer>
      ) : null}
    </div>
  );
}
