import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
import type { ProgramRole } from "@/features/programs/domain/types";
import { resolveProgramPermissions } from "@/features/programs/domain/permissions";

type ProgramWorkflowTarget = Pick<ProgramDetailReadModel, "derived">;

export function canShowCreateProgramWorkflow(role: ProgramRole): boolean {
  return resolveProgramPermissions(role).canCreateProgram;
}

export function canShowEditProgramWorkflow(
  program: ProgramWorkflowTarget,
  role: ProgramRole,
): boolean {
  const permissions = resolveProgramPermissions(role, {
    isArchived: program.derived.isArchived,
  });
  return permissions.canUpdateProgram && !program.derived.isArchived;
}

export function canShowStatusProgramWorkflow(
  program: ProgramWorkflowTarget,
  role: ProgramRole,
): boolean {
  const permissions = resolveProgramPermissions(role, {
    isArchived: program.derived.isArchived,
  });
  return permissions.canTransitionProgramStatus && !program.derived.isArchived;
}

export function canShowArchiveProgramWorkflow(
  program: ProgramWorkflowTarget,
  role: ProgramRole,
): boolean {
  const permissions = resolveProgramPermissions(role, {
    isArchived: program.derived.isArchived,
  });
  return permissions.canArchiveProgram && !program.derived.isArchived;
}

export function canShowRestoreProgramWorkflow(
  program: ProgramWorkflowTarget,
  role: ProgramRole,
): boolean {
  const permissions = resolveProgramPermissions(role, {
    isArchived: program.derived.isArchived,
  });
  return permissions.canRestoreProgram && program.derived.isArchived;
}
