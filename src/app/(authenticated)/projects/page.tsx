import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadProjectsPage } from "@/features/projects/ui/load-project-pages";
import {
  ProjectList,
  ProjectLoadFailure,
  ProjectShell,
} from "@/features/projects/ui/project-views";
import styles from "@/features/projects/ui/projects.module.css";

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const supabase = await createSupabaseServerClient();
  const result = await loadProjectsPage(supabase, await searchParams);

  if (
    result.kind === "auth_required" ||
    result.kind === "organization_unavailable" ||
    result.kind === "organization_required" ||
    result.kind === "forbidden" ||
    result.kind === "error"
  ) {
    return <ProjectLoadFailure result={result} targetPath="/projects" />;
  }
  if (result.kind === "query_error") {
    return (
      <ProjectShell context={result.context} action="/projects">
        <section className={styles.statePanel}>
          <h1>Unable to load {result.context.terminology.project.plural.toLowerCase()}</h1>
          <p role="alert">{result.message}</p>
          <a href={`/projects?org=${encodeURIComponent(result.context.organizationId)}`}>Try again</a>
        </section>
      </ProjectShell>
    );
  }
  return (
    <ProjectShell context={result.context} action="/projects">
      <ProjectList context={result.context} projects={result.projects} filters={result.filters} />
    </ProjectShell>
  );
}
