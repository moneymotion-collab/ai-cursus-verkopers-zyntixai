import { redirect } from "next/navigation";
import { buildSocialWorkspaceHref } from "@/features/social-media/domain/social-navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Legacy verification URL — folds into /social Publish. */
export default async function LegacyB18InstagramPublishRedirect({
  searchParams,
}: PageProps) {
  const raw = await searchParams;
  redirect(
    buildSocialWorkspaceHref({
      organizationId: first(raw.org),
      section: "publish",
      publicationId: first(raw.publication),
    }),
  );
}
