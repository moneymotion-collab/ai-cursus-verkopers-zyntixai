import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import { loadOperatorClosedBetaOrganizationDetail } from "@/features/social-media/server/platform-closed-beta-operator";
import { resolvePlatformClosedBetaOperatorSession } from "@/features/social-media/server/platform-operator-session";
import { PlatformClosedBetaOperatorDetail } from "@/features/social-media/ui/platform-closed-beta-operator-detail";
import { SOCIAL_CLOSED_BETA_OPERATOR_ROUTE } from "@/features/social-media/domain/platform-operator-navigation";
import Link from "next/link";
import styles from "../page.module.css";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function SocialClosedBetaOperatorDetailPage({
  params,
}: PageProps) {
  const { organizationId } = await params;
  const supabase = await createSupabaseServerClient();
  const session = await resolvePlatformClosedBetaOperatorSession(supabase);

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

  const detail = await loadOperatorClosedBetaOrganizationDetail(
    session.service,
    organizationId,
  );

  if (!detail) {
    return (
      <AppShell activeNav="home" membersNavVisible={false}>
        <section className={styles.statePanel} aria-labelledby="missing-title">
          <h1 id="missing-title">Organization not found</h1>
          <p>
            <Link href={SOCIAL_CLOSED_BETA_OPERATOR_ROUTE}>Back to list</Link>
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="home" membersNavVisible={false}>
      <PlatformClosedBetaOperatorDetail
        detail={detail}
        globalPublishingEnabled={isSocialPublishingFeatureEnabled()}
      />
    </AppShell>
  );
}
