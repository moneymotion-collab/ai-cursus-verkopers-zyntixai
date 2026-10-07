import { DUTCH_PUBLIC_PATHNAMES } from "@/lib/i18n/dutch-public-paths";

export const PUBLIC_SITE_ORIGIN = "https://www.zyntixai.com";

export const PUBLIC_HOME_PATH = "/" as const;
export const PUBLIC_PLATFORM_PATH = "/platform" as const;
export const PUBLIC_AUDIENCES_PATH = "/voor-wie" as const;
export const PUBLIC_HOW_PATH = "/zo-werkt-het" as const;
export const PUBLIC_ABOUT_PATH = "/over" as const;
export const PUBLIC_PRIVACY_PATH = "/privacy" as const;
export const PUBLIC_LOGIN_PATH = "/login" as const;

export const PUBLIC_INFORMATION_PATHS = DUTCH_PUBLIC_PATHNAMES;

export function publicCanonicalUrl(path: string): string {
  if (path === "/") {
    return `${PUBLIC_SITE_ORIGIN}/`;
  }
  return `${PUBLIC_SITE_ORIGIN}${path}`;
}
