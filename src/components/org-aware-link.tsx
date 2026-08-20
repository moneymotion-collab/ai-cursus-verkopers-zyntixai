"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

type OrgAwareLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  /** Path or path+query without relying on a stale org query. */
  href: string;
  /** Server-selected organization when known. */
  organizationId?: string;
};

function applyOrg(href: string, organizationId?: string): string {
  if (!organizationId) {
    return href;
  }
  try {
    const url = new URL(href, "https://zyntixai.local");
    if (!url.searchParams.has("org")) {
      url.searchParams.set("org", organizationId);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

/**
 * Primary-nav link that keeps `org` from the server selection or the current URL.
 * Prevents soft-navigation loading shells from dropping tenant context on click.
 */
export function OrgAwareLink({
  href,
  organizationId,
  ...props
}: OrgAwareLinkProps) {
  const searchParams = useSearchParams();
  const urlOrg = searchParams.get("org")?.trim() || undefined;
  const resolvedOrg = organizationId || urlOrg;
  const resolvedHref = applyOrg(href, resolvedOrg);

  return <Link href={resolvedHref} {...props} />;
}
