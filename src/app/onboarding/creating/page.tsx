import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import {
  buildReadyOnboardingPath,
  buildTeamOnboardingPath,
  buildOnboardingStagePath,
} from "@/features/onboarding/domain/onboarding-routes";
import { shouldEnterReadySurface } from "@/features/onboarding/domain/onboarding-ready";
import { resolveOnboardingLifecycleDestination } from "@/features/onboarding/domain/onboarding-lifecycle";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import { resolveOrganizationOnboardingLifecycle } from "@/features/onboarding/server/resolve-onboarding-lifecycle";
import { loadOnboardingCreatingSnapshot } from "@/features/onboarding/server/onboarding-invite-execution";
import { OnboardingStatusPanel } from "@/features/onboarding/ui/onboarding-status-panel";
import { OnboardingCreating } from "@/features/onboarding/ui/onboarding-creating";

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

export default async function CreatingOnboardingPage({
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
              ? "Complete organization setup before creating invitations."
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

  if (lifecycle.state.kind === "v2_completed") {
    redirect(buildProductDestination(actor.organizationId));
  }

  if (lifecycle.state.kind !== "v2_ready") {
    const destination = resolveOnboardingLifecycleDestination(
      lifecycle.state,
      actor.role,
    );
    redirect(
      buildOnboardingStagePath(destination.stageRoute, actor.organizationId),
    );
  }

  if (lifecycle.membershipRole !== "owner") {
    redirect(buildOnboardingPath(actor.organizationId));
  }

  const snapshot = await loadOnboardingCreatingSnapshot(
    supabase,
    actor.organizationId,
  );
  if (!snapshot.ok) {
    return (
      <OnboardingStatusPanel
        title="Invitation setup needs attention"
        message={snapshot.message}
      />
    );
  }

  if (snapshot.runStatus === "completed") {
    return (
      <OnboardingStatusPanel
        title="Setup needs attention"
        message="We could not safely determine the next setup step. Refresh or contact support."
      />
    );
  }

  if (shouldEnterReadySurface(snapshot.runStatus)) {
    redirect(buildReadyOnboardingPath(actor.organizationId));
  }

  return (
    <OnboardingCreating
      organizationId={actor.organizationId}
      initialIntents={snapshot.intents}
      initialOutcomes={snapshot.outcomes}
      initialRunStatus={snapshot.runStatus}
    />
  );
}
