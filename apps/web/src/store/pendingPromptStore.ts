"use client";

import { create } from "zustand";

/**
 * Tiny one-slot queue used to send a pre-composed prompt into the chat
 * panel from other parts of the UI (e.g. the preview panel's
 * "Fix with AI" button reads the WebContainer stderr buffer and pushes
 * the resulting prompt here).
 *
 * The chat panel subscribes: when `pending` becomes non-null it calls
 * `useChat.sendMessage({ text })` and clears the slot. Keeping this in
 * its own store avoids circular state between `ChatPanel` and
 * `PreviewPanel` and sidesteps the fact that `useChat` is local to
 * `ChatPanel`.
 */
export interface PendingPromptState {
  pending: string | null;
  setPending: (text: string) => void;
  clearPending: () => void;
}

export const usePendingPromptStore = create<PendingPromptState>((set) => ({
  pending: null,
  setPending: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    set({ pending: trimmed });
  },
  clearPending: () => set({ pending: null }),
}));
