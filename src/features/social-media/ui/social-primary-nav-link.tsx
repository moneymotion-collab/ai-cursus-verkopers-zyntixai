import Link from "next/link";
import {
  SOCIAL_NAV_LABEL,
  SOCIAL_NAV_VISIBLE,
  SOCIAL_ROUTE,
} from "@/features/social-media/domain/social-navigation";
import styles from "@/components/app-shell.module.css";

type SocialPrimaryNavLinkProps = {
  selectedOrganizationId?: string;
  visible: boolean;
  active?: boolean;
};

/**
 * Deterministic Social primary-nav link.
 * Visibility is resolved by the server AppShell wrapper before paint.
 */
export function SocialPrimaryNavLink({
  selectedOrganizationId,
  visible,
  active = false,
}: SocialPrimaryNavLinkProps) {
  if (!SOCIAL_NAV_VISIBLE || !visible) {
    return null;
  }

  const href = selectedOrganizationId
    ? `${SOCIAL_ROUTE}?org=${encodeURIComponent(selectedOrganizationId)}`
    : SOCIAL_ROUTE;

  return (
    <Link
      className={styles.navLink}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      {SOCIAL_NAV_LABEL}
    </Link>
  );
}
