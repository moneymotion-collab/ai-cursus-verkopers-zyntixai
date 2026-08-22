import { Suspense } from "react";
import Link from "next/link";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import styles from "./app-shell.module.css";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  PROGRAMS_NAV_LABEL,
  PROGRAMS_NAV_VISIBLE,
  PROGRAMS_ROUTE,
} from "@/features/programs/domain/programs-navigation";
import {
  ENROLLMENTS_NAV_LABEL,
  ENROLLMENTS_NAV_VISIBLE,
  ENROLLMENTS_ROUTE,
} from "@/features/enrollments/domain/enrollments-navigation";
import {
  PROGRESS_NAV_LABEL,
  PROGRESS_NAV_VISIBLE,
  PROGRESS_ROUTE,
} from "@/features/progress/domain/progress-navigation";
import {
  ATTENTION_NAV_LABEL,
  ATTENTION_NAV_VISIBLE,
  ATTENTION_ROUTE,
} from "@/features/attention/domain/attention-navigation";
import {
  MEMBERS_NAV_LABEL,
  MEMBERS_ROUTE,
  resolveMembersNavVisible,
} from "@/features/invitations/domain/members-navigation";
import { SocialPrimaryNavLink } from "@/features/social-media/ui/social-primary-nav-link";
import {
  CLOSED_BETA_SUPPORT_LABEL,
  resolveClosedBetaSupportMailto,
} from "@/features/support/closed-beta-support-contact";
import { OrgAwareLink } from "./org-aware-link";

type AppShellProps = {
  children: React.ReactNode;
  organizationOptions?: OrganizationOption[];
  selectedOrganizationId?: string;
  organizationSelectorAction?: string;
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
  activeNav?:
    | "home"
    | "leads"
    | "customers"
    | "programs"
    | "enrollments"
    | "progress"
    | "attention"
    | "social"
    | "tasks"
    | "members";
};

function PrimaryNavFallback({
  selectedOrganizationId,
  socialNavVisible,
  showMembersNav,
  activeNav,
}: {
  selectedOrganizationId?: string;
  socialNavVisible?: boolean;
  showMembersNav: boolean;
  activeNav: NonNullable<AppShellProps["activeNav"]>;
}) {
  const withOrg = (path: string) =>
    selectedOrganizationId
      ? `${path}?org=${encodeURIComponent(selectedOrganizationId)}`
      : path;

  return (
    <nav className={styles.nav} aria-label="Primary">
      <Link
        className={styles.navLink}
        href={withOrg("/home")}
        aria-current={activeNav === "home" ? "page" : undefined}
      >
        Home
      </Link>
      <Link
        className={styles.navLink}
        href={withOrg("/leads")}
        aria-current={activeNav === "leads" ? "page" : undefined}
      >
        Leads
      </Link>
      <Link
        className={styles.navLink}
        href={withOrg("/customers")}
        aria-current={activeNav === "customers" ? "page" : undefined}
      >
        Customers
      </Link>
      {PROGRAMS_NAV_VISIBLE ? (
        <Link
          className={styles.navLink}
          href={withOrg(PROGRAMS_ROUTE)}
          aria-current={activeNav === "programs" ? "page" : undefined}
        >
          {PROGRAMS_NAV_LABEL}
        </Link>
      ) : null}
      {ENROLLMENTS_NAV_VISIBLE ? (
        <Link
          className={styles.navLink}
          href={withOrg(ENROLLMENTS_ROUTE)}
          aria-current={activeNav === "enrollments" ? "page" : undefined}
        >
          {ENROLLMENTS_NAV_LABEL}
        </Link>
      ) : null}
      {PROGRESS_NAV_VISIBLE ? (
        <Link
          className={styles.navLink}
          href={withOrg(PROGRESS_ROUTE)}
          aria-current={activeNav === "progress" ? "page" : undefined}
        >
          {PROGRESS_NAV_LABEL}
        </Link>
      ) : null}
      {ATTENTION_NAV_VISIBLE ? (
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
      <Link
        className={styles.navLink}
        href={withOrg("/tasks")}
        aria-current={activeNav === "tasks" ? "page" : undefined}
      >
        Tasks
      </Link>
      {showMembersNav ? (
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
  activeNav,
}: {
  selectedOrganizationId?: string;
  socialNavVisible?: boolean;
  showMembersNav: boolean;
  activeNav: NonNullable<AppShellProps["activeNav"]>;
}) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <OrgAwareLink
        className={styles.navLink}
        href="/home"
        organizationId={selectedOrganizationId}
        aria-current={activeNav === "home" ? "page" : undefined}
      >
        Home
      </OrgAwareLink>
      <OrgAwareLink
        className={styles.navLink}
        href="/leads"
        organizationId={selectedOrganizationId}
        aria-current={activeNav === "leads" ? "page" : undefined}
      >
        Leads
      </OrgAwareLink>
      <OrgAwareLink
        className={styles.navLink}
        href="/customers"
        organizationId={selectedOrganizationId}
        aria-current={activeNav === "customers" ? "page" : undefined}
      >
        Customers
      </OrgAwareLink>
      {PROGRAMS_NAV_VISIBLE ? (
        <OrgAwareLink
          className={styles.navLink}
          href={PROGRAMS_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "programs" ? "page" : undefined}
        >
          {PROGRAMS_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
      {ENROLLMENTS_NAV_VISIBLE ? (
        <OrgAwareLink
          className={styles.navLink}
          href={ENROLLMENTS_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "enrollments" ? "page" : undefined}
        >
          {ENROLLMENTS_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
      {PROGRESS_NAV_VISIBLE ? (
        <OrgAwareLink
          className={styles.navLink}
          href={PROGRESS_ROUTE}
          organizationId={selectedOrganizationId}
          aria-current={activeNav === "progress" ? "page" : undefined}
        >
          {PROGRESS_NAV_LABEL}
        </OrgAwareLink>
      ) : null}
      {ATTENTION_NAV_VISIBLE ? (
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
      <OrgAwareLink
        className={styles.navLink}
        href="/tasks"
        organizationId={selectedOrganizationId}
        aria-current={activeNav === "tasks" ? "page" : undefined}
      >
        Tasks
      </OrgAwareLink>
      {showMembersNav ? (
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
                  activeNav={activeNav}
                />
              }
            >
              <PrimaryNav
                selectedOrganizationId={selectedOrganizationId}
                socialNavVisible={socialNavVisible}
                showMembersNav={showMembersNav}
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
