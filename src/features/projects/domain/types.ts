import type { ProductTerminology } from "@/features/product-access/domain/terminology";

export const PROJECT_STATUSES = [
  "planned",
  "active",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectRole = "owner" | "admin" | "staff" | "viewer";

export type ProjectPermissions = {
  canCreate: boolean;
  canUpdate: boolean;
  canTransition: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canViewArchived: boolean;
};

export type ProjectRecord = {
  id: string;
  organizationId: string;
  customerId: string;
  customerLabel: string;
  name: string;
  summary: string | null;
  status: ProjectStatus;
  ownerMemberId: string | null;
  ownerLabel: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
};

export type ProjectOption = { value: string; label: string };

export type ProjectFormOptions = {
  customers: ProjectOption[];
  members: ProjectOption[];
  warning: string | null;
};

export type ProjectPageContext = {
  organizationId: string;
  organizationName: string;
  organizationOptions: import("@/features/tasks/ui/resolve-task-organization-selection").OrganizationOption[];
  role: ProjectRole;
  terminology: ProductTerminology;
  moduleAccess: import("@/features/product-access/domain/types").ProductModuleAccessState;
};

export function projectPermissions(
  role: ProjectRole,
  archived = false,
): ProjectPermissions {
  const editor = role === "owner" || role === "admin" || role === "staff";
  const administrator = role === "owner" || role === "admin";
  return {
    canCreate: editor,
    canUpdate: editor && !archived,
    canTransition: editor && !archived,
    canArchive: administrator && !archived,
    canRestore: administrator && archived,
    canViewArchived: administrator,
  };
}

export function projectStatusLabel(status: ProjectStatus): string {
  return status.replace("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
