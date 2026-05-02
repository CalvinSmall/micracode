"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";

function languageForPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".jsx")) return "javascript";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs"))
    return "javascript";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".html")) return "html";
  return "plaintext";
}

export interface MonacoEditorPaneProps {
  filePath: string;
  contents: string;
  onChangeContents: (value: string) => void;
  onMountEditor: (editor: import("monaco-editor").editor.IStandaloneCodeEditor) => void;
}

/**
 * Single-file Monaco surface. Uncontrolled buffer with explicit sync when
 * disk / stream content changes and the editor is not focused.
 */
export function MonacoEditorPane({
  filePath,
  contents,
  onChangeContents,
  onMountEditor,
}: MonacoEditorPaneProps) {
  const editorRef = useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(
    null,
  );
  const focusedRef = useRef(false);

  const focusSubsRef = useRef<(() => void) | null>(null);

  const handleMount: OnMount = useCallback(
    (editor) => {
      focusSubsRef.current?.();
      editorRef.current = editor;
      onMountEditor(editor);
      const s1 = editor.onDidFocusEditorWidget(() => {
        focusedRef.current = true;
      });
      const s2 = editor.onDidBlurEditorWidget(() => {
        focusedRef.current = false;
      });
      focusSubsRef.current = () => {
        s1.dispose();
        s2.dispose();
        focusSubsRef.current = null;
      };
    },
    [onMountEditor],
  );

  useEffect(
    () => () => {
      focusSubsRef.current?.();
    },
    [filePath],
  );

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (focusedRef.current) return;
    const cur = ed.getValue();
    if (cur !== contents) {
      ed.setValue(contents);
    }
  }, [filePath, contents]);

  return (
    <Editor
      key={filePath}
      height="100%"
      theme="vs-dark"
      path={filePath}
      defaultLanguage={languageForPath(filePath)}
      defaultValue={contents}
      onMount={handleMount}
      onChange={(v) => onChangeContents(v ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 20,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        padding: { top: 8, bottom: 8 },
      }}
    />
  );
}
