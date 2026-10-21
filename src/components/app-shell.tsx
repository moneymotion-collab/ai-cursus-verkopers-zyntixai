import { loadSocialPrimaryNavVisibility } from "@/features/social-media/server/load-social-primary-nav-visibility";
import {
  AppShellChrome,
  type AppShellProps,
} from "./app-shell-chrome";

export type { AppShellActiveNav, AppShellProps } from "./app-shell-chrome";

/**
 * Server AppShell wrapper. Resolves Social nav visibility once per render,
 * then paints client-safe chrome. Presentation only — not an access grant.
 */
export async function AppShell(props: AppShellProps) {
  const socialNavVisible = await resolveAppShellSocialNavVisible(props);
  return <AppShellChrome {...props} socialNavVisible={socialNavVisible} />;
}

async function resolveAppShellSocialNavVisible(
  props: AppShellProps,
): Promise<boolean> {
  if (props.navigationPresentation === "pending") {
    return false;
  }

  const organizationId = props.selectedOrganizationId?.trim();
  if (!organizationId) {
    return false;
  }

  if (typeof props.socialNavVisible === "boolean") {
    return props.socialNavVisible;
  }

  return loadSocialPrimaryNavVisibility(organizationId);
}
