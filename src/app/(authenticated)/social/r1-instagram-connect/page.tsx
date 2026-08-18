import { redirect } from "next/navigation";
import { buildSocialWorkspaceHref } from "@/features/social-media/domain/social-navigation";
import {
  SOCIAL_OAUTH_OUTCOME_QUERY,
} from "@/features/social-media/server/oauth-callback-redirect";
import { SOCIAL_OAUTH_FAILURE_STAGE_QUERY } from "@/features/social-media/domain/oauth-failure-stage";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Legacy verification URL — preserves OAuth continuation into /social. */
export default async function LegacyR1InstagramConnectRedirect({
  searchParams,
}: PageProps) {
  const raw = await searchParams;
  redirect(
    buildSocialWorkspaceHref({
      organizationId: first(raw.org),
      section: "accounts",
      oauthOutcome: first(raw[SOCIAL_OAUTH_OUTCOME_QUERY]),
      oauthFailureStage: first(raw[SOCIAL_OAUTH_FAILURE_STAGE_QUERY]),
    }),
  );
}
