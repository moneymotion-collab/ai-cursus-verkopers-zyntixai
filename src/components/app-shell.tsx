import Link from "next/link";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import styles from "./app-shell.module.css";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  PROGRAMS_NAV_LABEL,
  PROGRAMS_NAV_VISIBLE,
  PROGRAMS_ROUTE,
} from "@/features/programs/domain/programs-navigation";

type AppShellProps = {
  children: React.ReactNode;
  organizationOptions?: OrganizationOption[];
  selectedOrganizationId?: string;
  organizationSelectorAction?: string;
  activeNav?: "home" | "leads" | "customers" | "programs" | "tasks";
};

export function AppShell({
  children,
  organizationOptions = [],
  selectedOrganizationId,
  organizationSelectorAction = "/tasks",
  activeNav = "tasks",
}: AppShellProps) {
  const showOrgSelector = organizationOptions.length > 1;

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
              <Link
                className={styles.navLink}
                href="/tasks"
                aria-current={activeNav === "tasks" ? "page" : undefined}
              >
                Tasks
              </Link>
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
