import type { ProductTerminology } from "@/features/product-access/domain/terminology";

export type CustomerLifecycleWorkflowAction = "archive" | "restore" | "status";

const UNRESOLVED_LIFECYCLE_SUBJECT = {
  singular: "Record",
  plural: "Records",
} as const;

function lifecycleSubject(terminology?: ProductTerminology | null) {
  return terminology?.customer ?? UNRESOLVED_LIFECYCLE_SUBJECT;
}

export function lifecycleSubjectInSentence(
  terminology?: ProductTerminology | null,
): string {
  const singular = lifecycleSubject(terminology).singular.trim();
  if (!singular) {
    return "record";
  }
  return singular.charAt(0).toLowerCase() + singular.slice(1);
}

export function lifecycleAuthRequiredCopy(
  action: CustomerLifecycleWorkflowAction,
): string {
  if (action === "status") {
    return "Please sign in to change the status of this record.";
  }
  if (action === "archive") {
    return "Please sign in to archive this record.";
  }
  return "Please sign in to restore this record.";
}

export function lifecycleOrganizationRequiredDescription(
  action: CustomerLifecycleWorkflowAction,
): string {
  if (action === "status") {
    return "Select an organization before changing the status of this record.";
  }
  if (action === "archive") {
    return "Select an organization before archiving this record.";
  }
  return "Select an organization before restoring this record.";
}

export function lifecycleActionUnavailableHeading(
  action: CustomerLifecycleWorkflowAction,
  terminology: ProductTerminology,
): string {
  const noun = lifecycleSubjectInSentence(terminology);
  if (action === "status") {
    return "Change status unavailable";
  }
  if (action === "archive") {
    return `Archive ${noun} unavailable`;
  }
  return `Restore ${noun} unavailable`;
}

export function lifecycleActionUnavailableMessage(
  action: CustomerLifecycleWorkflowAction,
  terminology: ProductTerminology,
): string {
  const noun = lifecycleSubjectInSentence(terminology);
  if (action === "status") {
    return `This ${noun} status cannot be changed in its current state.`;
  }
  if (action === "archive") {
    return `This ${noun} cannot be archived in its current state.`;
  }
  return `This ${noun} cannot be restored in its current state.`;
}

export function lifecycleBackToSubjectLabel(
  terminology?: ProductTerminology | null,
): string {
  return `Back to ${lifecycleSubjectInSentence(terminology)}`;
}
