import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import { OperatingModelSelector } from "@/features/onboarding/ui/operating-model-selector";
import { OnboardingStatusPanel } from "@/features/onboarding/ui/onboarding-status-panel";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import {
  isCourseSellerContextPack,
  resolveOperatingModelSetupStatus,
} from "@/features/onboarding/server/operating-model-status";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function OperatingModelOnboardingPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const rawOrganizationId = firstParam(params.org);
  const organizationId =
    rawOrganizationId && isUuid(rawOrganizationId)
      ? rawOrganizationId
      : undefined;
  const supabase = await createSupabaseServerClient();
  const actor = await resolveOnboardingOrganizationId(
    supabase,
    organizationId,
  );

  if (!actor.ok) {
    if (actor.code === "not_authenticated") {
      const next = organizationId
        ? `/onboarding/operating-model?org=${encodeURIComponent(organizationId)}`
        : "/onboarding/operating-model";
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }

    const ambiguous = actor.code === "organization_ambiguous";
    const missing = actor.code === "membership_required";
    return (
      <main className={styles.page} aria-labelledby="onboarding-status-title">
        <p className={styles.brand}>ZyntixAI</p>
        <OnboardingStatusPanel
          title={
            ambiguous
              ? "Choose an organization"
              : missing
                ? "Organization setup required"
                : "Organization unavailable"
          }
          message={
            ambiguous
              ? "Choose the organization you want to configure."
              : missing
                ? "Complete organization setup before choosing an operating model."
                : "This organization is unavailable or you no longer have access."
          }
          primaryHref={missing ? "/register/complete" : "/home"}
          primaryLabel={missing ? "Continue setup" : "Back to ZyntixAI"}
        />
      </main>
    );
  }

  const status = await resolveOperatingModelSetupStatus({
    supabase,
    organizationId: actor.organizationId,
    role: actor.role,
  });

  if (status.kind === "configured") {
    redirect(
      isCourseSellerContextPack(status.packKey)
        ? buildOnboardingPath(actor.organizationId)
        : buildProductDestination(actor.organizationId),
    );
  }

  if (status.kind === "configuration_review_required") {
    return (
      <main className={styles.page} aria-labelledby="onboarding-status-title">
        <p className={styles.brand}>ZyntixAI</p>
        <OnboardingStatusPanel
          title="Workspace configuration needs attention"
          message="This workspace already contains configuration that cannot be replaced automatically. Ask an administrator to review it."
          primaryHref={buildProductDestination(actor.organizationId)}
          primaryLabel="Back to workspace"
        />
      </main>
    );
  }

  if (!status.canAssign) {
    return (
      <main className={styles.page} aria-labelledby="onboarding-status-title">
        <p className={styles.brand}>ZyntixAI</p>
        <OnboardingStatusPanel
          title="Administrator setup required"
          message="Your workspace still needs to be configured by an owner or administrator."
          primaryHref={buildProductDestination(actor.organizationId)}
          primaryLabel="Back to workspace"
        />
      </main>
    );
  }

  return (
    <main className={styles.page} aria-labelledby="operating-model-title">
      <p className={styles.brand}>ZyntixAI</p>
      <OperatingModelSelector organizationId={actor.organizationId} />
    </main>
  );
}
