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
import {
  SOCIAL_NAV_LABEL,
  SOCIAL_NAV_VISIBLE,
  SOCIAL_ROUTE,
} from "@/features/social-media/domain/social-navigation";

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

export function AppShell({
  children,
  organizationOptions = [],
  selectedOrganizationId,
  organizationSelectorAction = "/tasks",
  membersNavVisible,
  activeNav = "tasks",
}: AppShellProps) {
  const showOrgSelector = organizationOptions.length > 1;
  const showMembersNav = resolveMembersNavVisible({
    explicitVisibility: membersNavVisible,
    organizationOptions,
    selectedOrganizationId,
  });

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandBlock}>
            <p className={styles.brand}>ZyntixAI</p>
            <nav className={styles.nav} aria-label="Primary">
              <Link
                className={styles.navLink}
                href="/"
                aria-current={activeNav === "home" ? "page" : undefined}
              >
                Home
              </Link>
              <Link
                className={styles.navLink}
                href="/leads"
                aria-current={activeNav === "leads" ? "page" : undefined}
              >
                Leads
              </Link>
              <Link
                className={styles.navLink}
                href="/customers"
                aria-current={activeNav === "customers" ? "page" : undefined}
              >
                Customers
              </Link>
              {PROGRAMS_NAV_VISIBLE ? (
                <Link
                  className={styles.navLink}
                  href={PROGRAMS_ROUTE}
                  aria-current={activeNav === "programs" ? "page" : undefined}
                >
                  {PROGRAMS_NAV_LABEL}
                </Link>
              ) : null}
              {ENROLLMENTS_NAV_VISIBLE ? (
                <Link
                  className={styles.navLink}
                  href={ENROLLMENTS_ROUTE}
                  aria-current={activeNav === "enrollments" ? "page" : undefined}
                >
                  {ENROLLMENTS_NAV_LABEL}
                </Link>
              ) : null}
              {PROGRESS_NAV_VISIBLE ? (
                <Link
                  className={styles.navLink}
                  href={PROGRESS_ROUTE}
                  aria-current={activeNav === "progress" ? "page" : undefined}
                >
                  {PROGRESS_NAV_LABEL}
                </Link>
              ) : null}
              {ATTENTION_NAV_VISIBLE ? (
                <Link
                  className={styles.navLink}
                  href={ATTENTION_ROUTE}
                  aria-current={activeNav === "attention" ? "page" : undefined}
                >
                  {ATTENTION_NAV_LABEL}
                </Link>
              ) : null}
              {SOCIAL_NAV_VISIBLE ? (
                <Link
                  className={styles.navLink}
                  href={
                    selectedOrganizationId
                      ? `${SOCIAL_ROUTE}?org=${encodeURIComponent(selectedOrganizationId)}`
                      : SOCIAL_ROUTE
                  }
                  aria-current={activeNav === "social" ? "page" : undefined}
                >
                  {SOCIAL_NAV_LABEL}
                </Link>
              ) : null}
              <Link
                className={styles.navLink}
                href="/tasks"
                aria-current={activeNav === "tasks" ? "page" : undefined}
              >
                Tasks
              </Link>
              {showMembersNav ? (
                <Link
                  className={styles.navLink}
                  href={
                    selectedOrganizationId
                      ? `${MEMBERS_ROUTE}?org=${encodeURIComponent(selectedOrganizationId)}`
                      : MEMBERS_ROUTE
                  }
                  aria-current={activeNav === "members" ? "page" : undefined}
                >
                  {MEMBERS_NAV_LABEL}
                </Link>
              ) : null}
            </nav>
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
    </div>
  );
}
