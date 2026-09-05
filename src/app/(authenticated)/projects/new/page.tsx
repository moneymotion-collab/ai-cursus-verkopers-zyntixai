import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/features/projects/ui/project-form";
import { loadProjectCreatePage } from "@/features/projects/ui/load-project-pages";
import {
  ProjectLoadFailure,
  ProjectShell,
} from "@/features/projects/ui/project-views";
import styles from "@/features/projects/ui/projects.module.css";

type ProjectCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectCreatePage({ searchParams }: ProjectCreatePageProps) {
  const supabase = await createSupabaseServerClient();
  const result = await loadProjectCreatePage(supabase, await searchParams);

  if (
    result.kind === "auth_required" ||
    result.kind === "organization_unavailable" ||
    result.kind === "organization_required" ||
    result.kind === "forbidden" ||
    result.kind === "error"
  ) {
    return <ProjectLoadFailure result={result} targetPath="/projects/new" />;
  }
  if (result.kind !== "ready") {
    const term = result.context.terminology.project.singular;
    const message =
      result.kind === "unavailable"
        ? `${term} setup is unavailable.`
        : result.message;
    return (
      <ProjectShell context={result.context} action="/projects/new">
        <section className={styles.statePanel}>
          <h1>Create {term.toLowerCase()} unavailable</h1>
          <p role="alert">{message}</p>
          <a href={`/projects?org=${encodeURIComponent(result.context.organizationId)}`}>
            Back to {result.context.terminology.project.plural.toLowerCase()}
          </a>
        </section>
      </ProjectShell>
    );
  }
  return (
    <ProjectShell context={result.context} action="/projects/new">
      <ProjectForm
        organizationId={result.context.organizationId}
        options={result.options}
        terminology={result.context.terminology}
      />
    </ProjectShell>
  );
}
