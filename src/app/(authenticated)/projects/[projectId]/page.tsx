import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadProjectDetailPage } from "@/features/projects/ui/load-project-pages";
import {
  ProjectDetail,
  ProjectLoadFailure,
  ProjectShell,
} from "@/features/projects/ui/project-views";
import styles from "@/features/projects/ui/projects.module.css";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { projectId } = await params;
  const result = await loadProjectDetailPage(supabase, projectId, await searchParams);

  if (
    result.kind === "auth_required" ||
    result.kind === "organization_unavailable" ||
    result.kind === "organization_required" ||
    result.kind === "forbidden" ||
    result.kind === "error"
  ) {
    return <ProjectLoadFailure result={result} targetPath={`/projects/${projectId}`} />;
  }
  if (result.kind === "unavailable" || result.kind === "query_error") {
    const term = result.context.terminology.project.singular;
    return (
      <ProjectShell context={result.context} action={`/projects/${projectId}`}>
        <section className={styles.statePanel}>
          <h1>{result.kind === "unavailable" ? `${term} unavailable` : `Unable to load ${term.toLowerCase()}`}</h1>
          <p role="alert">
            {result.kind === "unavailable"
              ? `This ${term.toLowerCase()} is unavailable or you do not have access.`
              : result.message}
          </p>
          <a href={`/projects?org=${encodeURIComponent(result.context.organizationId)}`}>
            Back to {result.context.terminology.project.plural.toLowerCase()}
          </a>
        </section>
      </ProjectShell>
    );
  }
  return (
    <ProjectShell context={result.context} action={`/projects/${projectId}`}>
      <ProjectDetail
        context={result.context}
        project={result.project}
        tasks={result.tasks}
        tasksWarning={result.tasksWarning}
        fieldSites={result.fieldSites}
        fieldWorkOrders={result.fieldWorkOrders}
        fieldWarning={result.fieldWarning}
      />
    </ProjectShell>
  );
}
