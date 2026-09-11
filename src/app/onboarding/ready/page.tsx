import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import { buildOperatingModelOnboardingPath } from "@/features/onboarding/domain/operating-model";
import {
  buildCreatingOnboardingPath,
  buildTeamOnboardingPath,
} from "@/features/onboarding/domain/onboarding-routes";
import { isDatabaseProvenReadyRunStatus } from "@/features/onboarding/domain/onboarding-ready";
import { resolveOnboardingLifecycleDestination } from "@/features/onboarding/domain/onboarding-lifecycle";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import { resolveOrganizationOnboardingLifecycle } from "@/features/onboarding/server/resolve-onboarding-lifecycle";
import { loadOnboardingReadySnapshot } from "@/features/onboarding/server/onboarding-ready";
import { OnboardingStatusPanel } from "@/features/onboarding/ui/onboarding-status-panel";
import { OnboardingReady } from "@/features/onboarding/ui/onboarding-ready";

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

export default async function ReadyOnboardingPage({
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
      const next = buildOnboardingPath(organizationId);
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }

    return (
      <OnboardingStatusPanel
        title={
          actor.code === "organization_ambiguous"
            ? "Choose an organization"
            : actor.code === "membership_required"
              ? "Organization setup required"
              : "Organization unavailable"
        }
        message={
          actor.code === "organization_ambiguous"
            ? "Choose the organization you want to configure."
            : actor.code === "membership_required"
              ? "Complete organization setup before finishing onboarding."
              : "This organization is unavailable or you no longer have access."
        }
      />
    );
  }

  const lifecycle = await resolveOrganizationOnboardingLifecycle(
    supabase,
    actor.organizationId,
  );
  if (!lifecycle.ok || lifecycle.state.kind === "invalid") {
    return (
      <OnboardingStatusPanel
        title="Setup needs attention"
        message="We could not safely determine the next setup step. Refresh or contact support."
      />
    );
  }

  if (lifecycle.state.kind === "v2_configured") {
    redirect(buildTeamOnboardingPath(actor.organizationId));
  }

  if (
    lifecycle.state.kind !== "v2_ready" &&
    lifecycle.state.kind !== "v2_completed"
  ) {
    const destination = resolveOnboardingLifecycleDestination(
      lifecycle.state,
      actor.role,
    );
    if (destination.availableRoute === "home") {
      redirect(buildProductDestination(actor.organizationId));
    }
    if (destination.availableRoute === "operating_model") {
      redirect(buildOperatingModelOnboardingPath(actor.organizationId));
    }
    redirect(buildOnboardingPath(actor.organizationId));
  }

  if (lifecycle.membershipRole !== "owner") {
    redirect(buildOnboardingPath(actor.organizationId));
  }

  const snapshot = await loadOnboardingReadySnapshot(
    supabase,
    actor.organizationId,
  );
  if (!snapshot.ok) {
    return (
      <OnboardingStatusPanel
        title="Ready setup needs attention"
        message={snapshot.message}
      />
    );
  }

  if (
    lifecycle.state.kind === "v2_ready" &&
    !isDatabaseProvenReadyRunStatus(snapshot.snapshot.runStatus)
  ) {
    redirect(buildCreatingOnboardingPath(actor.organizationId));
  }

  return <OnboardingReady snapshot={snapshot.snapshot} />;
}
