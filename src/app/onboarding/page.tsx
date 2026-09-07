import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readOnboardingContext } from "@/features/onboarding/server/read-onboarding-context";
import { onboardingMessage } from "@/features/onboarding/server/normalize-onboarding-error";
import {
  buildProductDestination,
  parseOnboardingStep,
} from "@/features/onboarding/domain/onboarding-steps";
import { OnboardingWizard } from "@/features/onboarding/ui/onboarding-wizard";
import { OnboardingStatusPanel } from "@/features/onboarding/ui/onboarding-status-panel";
import { buildOperatingModelOnboardingPath } from "@/features/onboarding/domain/operating-model";
import {
  isCourseSellerContextPack,
  resolveOperatingModelSetupStatus,
} from "@/features/onboarding/server/operating-model-status";
import { resolveOrganizationOnboardingLifecycle } from "@/features/onboarding/server/resolve-onboarding-lifecycle";
import { V2YouCompanyForm } from "@/features/onboarding/ui/v2-you-company-form";
import { buildWorkspaceConfirmationOnboardingPath } from "@/features/onboarding/domain/onboarding-routes";

/** Always read live onboarding draft — never serve a cached Step 2 snapshot. */
export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const orgRaw = firstParam(params.org);
  const stepRaw = firstParam(params.step);
  const organizationId =
    orgRaw && isUuid(orgRaw) ? orgRaw : undefined;
  const initialStep = stepRaw ? parseOnboardingStep(stepRaw) : undefined;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = organizationId
      ? `/onboarding?org=${encodeURIComponent(organizationId)}`
      : "/onboarding";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const result = await readOnboardingContext(supabase, organizationId);

  if (!result.ok) {
    if (result.code === "not_authenticated") {
      redirect("/login?next=/onboarding");
    }

    if (result.code === "membership_required") {
      return (
        <OnboardingStatusPanel
          title="Organization setup required"
          message={onboardingMessage("membership_required")}
          primaryHref="/register/complete"
          primaryLabel="Continue setup"
        />
      );
    }

    if (result.code === "organization_ambiguous") {
      return (
        <OnboardingStatusPanel
          title="Choose an organization"
          message={onboardingMessage("organization_ambiguous")}
          primaryHref="/leads"
          primaryLabel="Open organization list"
        />
      );
    }

    if (result.code === "organization_not_found") {
      return (
        <OnboardingStatusPanel
          title="Organization unavailable"
          message={onboardingMessage("organization_not_found")}
          primaryHref="/leads"
          primaryLabel="Back to ZyntixAI"
        />
      );
    }

    return (
      <OnboardingStatusPanel
        title="Unable to load setup"
        message={result.message}
        primaryHref="/onboarding"
        primaryLabel="Try again"
      />
    );
  }

  const lifecycle = await resolveOrganizationOnboardingLifecycle(
    supabase,
    result.context.organizationId,
  );
  if (!lifecycle.ok) {
    return (
      <OnboardingStatusPanel
        title="Unable to load setup"
        message="We could not confirm your current setup progress. Refresh to try again."
        primaryHref="/onboarding"
        primaryLabel="Try again"
      />
    );
  }

  if (lifecycle.state.kind === "v2_completed") {
    redirect(buildProductDestination(result.context.organizationId));
  }
  if (lifecycle.state.kind === "v2_context_required") {
    redirect(
      buildOperatingModelOnboardingPath(result.context.organizationId),
    );
  }
  if (lifecycle.state.kind === "v2_configured") {
    redirect(
      buildWorkspaceConfirmationOnboardingPath(
        result.context.organizationId,
      ),
    );
  }
  if (lifecycle.state.kind === "v2_owner_required") {
    return (
      <OnboardingStatusPanel
        title="Owner setup required"
        message="Your organization setup still needs to be completed by an owner."
        primaryHref="/leads"
        primaryLabel="Continue to workspace"
      />
    );
  }
  if (lifecycle.state.kind === "v2_core_incomplete") {
    return (
      <V2YouCompanyForm
        organizationId={result.context.organizationId}
        initialValues={{
          displayName: result.context.displayName ?? "",
          organizationName: result.context.organizationName,
          teamSizeBand: result.context.teamSizeBand ?? "",
        }}
      />
    );
  }
  if (lifecycle.state.kind.startsWith("v2_")) {
    return (
      <OnboardingStatusPanel
        title="Setup progress saved"
        message="Your server-verified setup progress is preserved. The next setup screen will continue from this point when it is available."
      />
    );
  }
  if (lifecycle.state.kind === "invalid") {
    return (
      <OnboardingStatusPanel
        title="Setup needs attention"
        message="We could not safely determine the next setup step. Refresh or contact support."
        primaryHref="/onboarding"
        primaryLabel="Try again"
      />
    );
  }

  const operatingModel = await resolveOperatingModelSetupStatus({
    supabase,
    organizationId: result.context.organizationId,
    role: result.context.membershipRole,
  });
  if (operatingModel.kind !== "configured") {
    redirect(
      buildOperatingModelOnboardingPath(result.context.organizationId),
    );
  }
  if (!isCourseSellerContextPack(operatingModel.packKey)) {
    redirect(buildProductDestination(result.context.organizationId));
  }

  if (lifecycle.state.kind === "grandfathered") {
    redirect(buildProductDestination(result.context.organizationId));
  }

  if (result.context.isComplete) {
    redirect(buildProductDestination(result.context.organizationId));
  }

  if (!result.context.isOwner) {
    return (
      <OnboardingStatusPanel
        title="Owner setup required"
        message="Your organization setup still needs to be completed by an owner."
        primaryHref="/leads"
        primaryLabel="Continue to workspace"
      />
    );
  }

  return (
    <OnboardingWizard
      key={[
        result.context.organizationId,
        result.context.businessType ?? "",
        result.context.primaryOffering ?? "",
        result.context.primaryAudience ?? "",
        result.context.primaryGoal ?? "",
        result.context.teamSizeBand ?? "",
        result.context.displayName ?? "",
        result.context.organizationName,
      ].join(":")}
      context={result.context}
      initialStep={initialStep}
    />
  );
}
