import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import { listOperatorClosedBetaOrganizations } from "@/features/social-media/server/platform-closed-beta-operator";
import { resolvePlatformClosedBetaOperatorSession } from "@/features/social-media/server/platform-operator-session";
import { PlatformClosedBetaOperatorList } from "@/features/social-media/ui/platform-closed-beta-operator-list";
import styles from "./page.module.css";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(
  value: string | string[] | undefined,
): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return "";
}

export default async function SocialClosedBetaOperatorListPage({
  searchParams,
}: PageProps) {
  const supabase = await createSupabaseServerClient();
  const session = await resolvePlatformClosedBetaOperatorSession(supabase);
  const params = await searchParams;

  if (!session.ok) {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="denied-title">
          <h1 id="denied-title">Operator access required</h1>
          <p>
            This internal Social closed-beta control plane is only available to
            authorized ZyntixAI platform operators.
          </p>
        </section>
      </AppShell>
    );
  }

  const items = await listOperatorClosedBetaOrganizations(session.service);

  return (
    <AppShell activeNav="home" membersNavVisible={false}>
      <PlatformClosedBetaOperatorList
        items={items}
        q={firstString(params.q)}
        status={firstString(params.status) || "all"}
        globalPublishingEnabled={isSocialPublishingFeatureEnabled()}
      />
    </AppShell>
  );
}
