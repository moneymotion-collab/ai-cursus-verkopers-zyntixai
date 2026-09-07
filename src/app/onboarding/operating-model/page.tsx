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
import { resolveOnboardingLifecycleDestination } from "@/features/onboarding/domain/onboarding-lifecycle";
import { resolveOrganizationOnboardingLifecycle } from "@/features/onboarding/server/resolve-onboarding-lifecycle";
import { operatingModelFromPackKey } from "@/features/onboarding/domain/operating-model";

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
        primaryHref="/onboarding/operating-model"
        primaryLabel="Try again"
      />
    );
  }
  if (
    lifecycle.state.kind !== "legacy" &&
    lifecycle.state.kind !== "v2_configured"
  ) {
    const destination = resolveOnboardingLifecycleDestination(
      lifecycle.state,
      actor.role,
    );
    if (destination.availableRoute === "home") {
      redirect(buildProductDestination(actor.organizationId));
    }
    if (destination.availableRoute === "onboarding") {
      redirect(buildOnboardingPath(actor.organizationId));
    }
  }

  const status = await resolveOperatingModelSetupStatus({
    supabase,
    organizationId: actor.organizationId,
    role: actor.role,
  });

  if (status.kind === "configured") {
    if (lifecycle.state.kind === "v2_configured") {
      const confirmedSelection = operatingModelFromPackKey(status.packKey);
      if (!confirmedSelection) {
        return (
          <OnboardingStatusPanel
            title="Workspace configuration needs attention"
            message="We could not safely confirm this workspace configuration. Refresh or contact support."
          />
        );
      }
      return (
        <OperatingModelSelector
          organizationId={actor.organizationId}
          initialSelection={confirmedSelection}
          confirmedSelection={confirmedSelection}
          flow="v2"
        />
      );
    }
    if (lifecycle.state.kind.startsWith("v2_")) {
      redirect(buildOnboardingPath(actor.organizationId));
    }
    redirect(
      isCourseSellerContextPack(status.packKey)
        ? buildOnboardingPath(actor.organizationId)
        : buildProductDestination(actor.organizationId),
    );
  }

  if (status.kind === "configuration_review_required") {
    return (
      <OnboardingStatusPanel
        title="Workspace configuration needs attention"
        message="This workspace already contains configuration that cannot be replaced automatically. Ask an administrator to review it."
        primaryHref={buildProductDestination(actor.organizationId)}
        primaryLabel="Back to workspace"
      />
    );
  }

  if (!status.canAssign) {
    return (
      <OnboardingStatusPanel
        title="Administrator setup required"
        message="Your workspace still needs to be configured by an owner or administrator."
        primaryHref={buildProductDestination(actor.organizationId)}
        primaryLabel="Back to workspace"
      />
    );
  }

  return (
    <OperatingModelSelector
      organizationId={actor.organizationId}
      flow={lifecycle.state.kind === "legacy" ? "legacy" : "v2"}
    />
  );
}
