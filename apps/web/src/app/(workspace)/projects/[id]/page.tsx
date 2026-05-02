import { notFound } from "next/navigation";

import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  getProject,
  getProjectFiles,
  getProjectPrompts,
} from "@/lib/api/projects";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prompt?: string | string[] }>;
}

export default async function ProjectWorkspacePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const initialPrompt = Array.isArray(resolvedSearchParams.prompt)
    ? resolvedSearchParams.prompt[0]
    : resolvedSearchParams.prompt;

  try {
    const [project, filesResponse, prompts] = await Promise.all([
      getProject(id),
      getProjectFiles(id),
      getProjectPrompts(id),
    ]);

    return (
      <WorkspaceShell
        projectId={project.id}
        projectName={project.name}
        initialTree={filesResponse.tree}
        initialPrompts={prompts}
        initialPrompt={initialPrompt?.trim() || undefined}
      />
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}
