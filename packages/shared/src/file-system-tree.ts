/**
 * WebContainer-compatible `FileSystemTree` shape.
 *
 * Mirrors `@webcontainer/api`'s `FileSystemTree` so the Zustand store can be
 * mounted directly via `webcontainerInstance.mount()` in Phase 3.
 */

export interface FileNode {
  file: {
    contents: string | Uint8Array;
  };
}

export interface DirectoryNode {
  directory: FileSystemTree;
}

export type FileSystemTree = Record<string, FileNode | DirectoryNode>;

/** Minimal flat representation useful for persistence + diffing. */
export interface FlatFile {
  path: string;
  content: string;
}
