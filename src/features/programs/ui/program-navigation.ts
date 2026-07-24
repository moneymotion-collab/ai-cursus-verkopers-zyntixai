import { PROGRAMS_ROUTE } from "@/features/programs/domain/programs-navigation";
import {
  buildProgramListQueryString,
  type ProgramListUrlState,
} from "@/features/programs/ui/program-list-search-params";

export function buildProgramsListHref(listState?: ProgramListUrlState): string {
  if (!listState) {
    return PROGRAMS_ROUTE;
  }
  return `${PROGRAMS_ROUTE}${buildProgramListQueryString(listState)}`;
}

export function buildProgramCreateHref(listState?: ProgramListUrlState): string {
  const base = `${PROGRAMS_ROUTE}/new`;
  if (!listState) {
    return base;
  }
  return `${base}${buildProgramListQueryString({
    org: listState.org,
    archived: false,
    sort: listState.sort,
    direction: listState.direction,
    page: 1,
    pageSize: listState.pageSize,
  })}`;
}

export function buildProgramDetailHref(
  programId: string,
  listState?: ProgramListUrlState,
): string {
  const base = `${PROGRAMS_ROUTE}/${encodeURIComponent(programId)}`;
  if (!listState) {
    return base;
  }
  return `${base}${buildProgramListQueryString(listState)}`;
}

export function buildBackToProgramsHref(listState?: ProgramListUrlState): string {
  return buildProgramsListHref(listState);
}

export {
  parseProgramListReturnState,
  buildProgramListQueryString,
} from "@/features/programs/ui/program-list-search-params";
