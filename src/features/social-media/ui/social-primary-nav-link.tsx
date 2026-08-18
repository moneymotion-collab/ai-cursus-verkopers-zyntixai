"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SOCIAL_NAV_LABEL,
  SOCIAL_NAV_VISIBLE,
  SOCIAL_ROUTE,
} from "@/features/social-media/domain/social-navigation";
import { getSocialClosedBetaNavVisibleAction } from "@/features/social-media/actions/get-social-closed-beta-nav-visible-action";
import styles from "@/components/app-shell.module.css";

type SocialPrimaryNavLinkProps = {
  selectedOrganizationId?: string;
  /** Explicit override — false always hides; true shows when SOCIAL_NAV_VISIBLE. */
  explicitVisibility?: boolean;
  active?: boolean;
};

/**
 * Fail-closed Social primary-nav link.
 * Starts hidden, then reveals only after server enrollment resolution (or explicit true).
 * Never briefly exposes Social for not-enrolled orgs.
 */
export function SocialPrimaryNavLink({
  selectedOrganizationId,
  explicitVisibility,
  active = false,
}: SocialPrimaryNavLinkProps) {
  const [visible, setVisible] = useState(explicitVisibility === true);

  useEffect(() => {
    if (!SOCIAL_NAV_VISIBLE) {
      setVisible(false);
      return;
    }
    if (explicitVisibility === false) {
      setVisible(false);
      return;
    }
    if (explicitVisibility === true) {
      setVisible(true);
      return;
    }
    if (!selectedOrganizationId) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    setVisible(false);
    void getSocialClosedBetaNavVisibleAction(selectedOrganizationId).then(
      (next) => {
        if (!cancelled) {
          setVisible(next);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId, explicitVisibility]);

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
