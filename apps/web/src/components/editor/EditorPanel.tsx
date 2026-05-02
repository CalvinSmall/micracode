"use client";

import { FileCode2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PanelShell } from "@/components/layout/PanelShell";
import { updateProjectFile } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import { flattenFileSystemTree, useFileSystemStore } from "@/store/fileSystemStore";

import type { MonacoEditorPaneProps } from "./MonacoEditorPane";

const MonacoEditorPane = dynamic(
  () => import("./MonacoEditorPane").then((m) => m.MonacoEditorPane),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[12rem] items-center justify-center text-xs text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
) as ComponentType<MonacoEditorPaneProps>;

export interface EditorPanelProps {
  projectId: string;
}

/**
 * Code editor panel: file list plus Monaco for the active file. Edits update
 * the shared Zustand tree (so chat / preview stay aligned) and are persisted to
 * disk via `PUT /v1/projects/{id}/files` with debounced writes.
 */
export function EditorPanel({ projectId }: EditorPanelProps) {
  const tree = useFileSystemStore((s) => s.tree);
  const upsertFile = useFileSystemStore((s) => s.upsertFile);
  const files = useMemo(() => flattenFileSystemTree(tree), [tree]);
  const writtenAt = useFileSystemStore((s) => s.writtenAt);
  const [selected, setSelected] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(
    null,
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ path: string; content: string } | null>(null);

  useEffect(() => {
    if (!selected && files.length > 0) {
      setSelected(files[0]!.path);
    }
    if (selected && !files.some((f) => f.path === selected)) {
      setSelected(files[0]?.path ?? null);
    }
  }, [files, selected]);

  const flushSave = useCallback(
    async (path: string | null) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const ed = editorRef.current;
      if (!ed || !path) return;
      const content = ed.getValue();
      pendingSaveRef.current = { path, content };
      upsertFile(path, content);
      try {
        await updateProjectFile(projectId, { path, content });
        setSaveError(null);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed");
      }
    },
    [projectId, upsertFile],
  );

  const schedulePersist = useCallback(
    (path: string, content: string) => {
      pendingSaveRef.current = { path, content };
      upsertFile(path, content);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const pending = pendingSaveRef.current;
        saveTimerRef.current = null;
        if (!pending) return;
        void updateProjectFile(projectId, {
          path: pending.path,
          content: pending.content,
        })
          .then(() => setSaveError(null))
          .catch((err) => {
            setSaveError(err instanceof Error ? err.message : "Save failed");
          });
      }, 500);
    },
    [projectId, upsertFile],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const selectFile = (path: string) => {
    if (path === selected) return;
    void flushSave(selected);
    setSelected(path);
  };

  const active = files.find((f) => f.path === selected) ?? null;

  const handleMountEditor = useCallback(
    (editor: import("monaco-editor").editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
    },
    [],
  );

  return (
    <PanelShell
      title="Editor"
      right={
        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          {files.length} file{files.length === 1 ? "" : "s"}
        </span>
      }
    >
      <div className="flex h-full min-h-0">
        <nav className="w-48 shrink-0 overflow-auto border-r border-border p-2">
          {files.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <FileCode2 className="size-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No files yet</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {files.map((f) => (
                <li key={f.path}>
                  <button
                    type="button"
                    onClick={() => selectFile(f.path)}
                    className={cn(
                      "block w-full truncate rounded px-2 py-1 text-left text-xs",
                      selected === f.path
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                    title={f.path}
                  >
                    {f.path}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {active ? (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-1.5">
                <span className="truncate font-mono text-xs">{active.path}</span>
                {writtenAt[active.path] ? (
                  <span className="text-[10px] text-muted-foreground">
                    updated {new Date(writtenAt[active.path]!).toLocaleTimeString()}
                  </span>
                ) : null}
              </div>
              {saveError ? (
                <p className="shrink-0 border-b border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] text-destructive">
                  {saveError}
                </p>
              ) : null}
              <div className="min-h-0 flex-1">
                <MonacoEditorPane
                  filePath={active.path}
                  contents={active.content}
                  onChangeContents={(value) => schedulePersist(active.path, value)}
                  onMountEditor={handleMountEditor}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
              Select a file to edit it.
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  );
}
