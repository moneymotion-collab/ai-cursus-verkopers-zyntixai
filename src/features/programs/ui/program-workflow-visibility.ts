import { resolveProgramPermissions } from "@/features/programs/domain/permissions";
import type { ProgramRole } from "@/features/programs/domain/types";

export function canShowCreateProgramWorkflow(role: ProgramRole): boolean {
  return resolveProgramPermissions(role).canCreateProgram;
}
