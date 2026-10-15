import ProgressLoading from "@/app/(authenticated)/progress/loading";
import ProgressDetailLoading from "@/app/(authenticated)/progress/[factId]/loading";
import ProgressCreateLoading from "@/app/(authenticated)/progress/new/loading";
import ProgressCorrectLoading from "@/app/(authenticated)/progress/[factId]/correct/loading";
import ProgressVoidLoading from "@/app/(authenticated)/progress/[factId]/void/loading";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import { FieldLoadFailure } from "@/features/field-operations/ui/views";
import { ProductOperationsLoadFailure } from "@/features/product-operations/ui/views";
import { ProjectLoadFailure } from "@/features/projects/ui/project-views";
import { Ad13GapErrors } from "./ad13-gap-errors";

const ORG = "11111111-1111-4111-8111-111111111111";

const access: ProductModuleAccessState = {
  resolution: "unresolved",
  navVisibility: FAIL_CLOSED_MODULE_NAV_VISIBILITY,
  relevantCapabilities: null,
  terminology: DEFAULT_PRODUCT_TERMINOLOGY,
};

const organizations = [
  { organizationId: ORG, role: "owner" as const, displayName: "AD13 example organization" },
];

export function Ad13GapPreview({ state }: { state: string }) {
  if (state.endsWith("-error") && state.startsWith("gap-progress")) {
    return <Ad13GapErrors state={state} />;
  }
  if (state === "gap-progress-loading") return <ProgressLoading />;
  if (state === "gap-progress-detail-loading") return <ProgressDetailLoading />;
  if (state === "gap-progress-new-loading") return <ProgressCreateLoading />;
  if (state === "gap-progress-correct-loading") return <ProgressCorrectLoading />;
  if (state === "gap-progress-void-loading") return <ProgressVoidLoading />;
  if (state === "gap-project-auth") return <ProjectLoadFailure result={{ kind: "auth_required" }} targetPath="/ad02-preview" />;
  if (state === "gap-project-unavailable") return <ProjectLoadFailure result={{ kind: "organization_unavailable" }} targetPath="/ad02-preview" />;
  if (state === "gap-project-org") {
    return <ProjectLoadFailure result={{ kind: "organization_required", organizations }} targetPath="/ad02-preview" />;
  }
  if (state === "gap-project-forbidden") {
    return <ProjectLoadFailure result={{ kind: "forbidden", message: "AD13 example access is not available.", moduleAccess: access }} targetPath="/ad02-preview" />;
  }
  if (state === "gap-project-error") {
    return <ProjectLoadFailure result={{ kind: "error", message: "AD13 example projects could not be loaded." }} targetPath="/ad02-preview" />;
  }
  if (state === "gap-field-auth") return <FieldLoadFailure result={{ kind: "auth_required" }} activeNav="sites" targetPath="/ad02-preview" />;
  if (state === "gap-field-forbidden") {
    return <FieldLoadFailure result={{ kind: "forbidden", message: "AD13 example field access is not available.", moduleAccess: access }} activeNav="sites" targetPath="/ad02-preview" />;
  }
  if (state === "gap-field-error") {
    return <FieldLoadFailure result={{ kind: "error", message: "AD13 example sites could not be loaded." }} activeNav="sites" targetPath="/ad02-preview" />;
  }
  if (state === "gap-product-auth") return <ProductOperationsLoadFailure result={{ kind: "auth_required" }} activeNav="orders" targetPath="/ad02-preview" />;
  if (state === "gap-product-org") {
    return <ProductOperationsLoadFailure result={{ kind: "organization_required", organizations }} activeNav="orders" targetPath="/ad02-preview" />;
  }
  if (state === "gap-product-forbidden") {
    return <ProductOperationsLoadFailure result={{ kind: "forbidden", message: "AD13 example product access is not available.", moduleAccess: access }} activeNav="orders" targetPath="/ad02-preview" />;
  }
  return (
    <ProductOperationsLoadFailure
      result={{ kind: "error", message: "AD13 example orders could not be loaded." }}
      activeNav="orders"
      targetPath="/ad02-preview"
    />
  );
}
