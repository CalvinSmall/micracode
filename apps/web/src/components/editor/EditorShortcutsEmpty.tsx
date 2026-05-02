"use client";

import { cn } from "@/lib/utils";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 px-1.5 font-mono text-[11px] text-zinc-300 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.4)]",
      )}
    >
      {children}
    </span>
  );
}

function ShortcutRow({
  label,
  keys,
}: {
  label: string;
  keys: string[];
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <Kbd key={`${label}-${i}`}>{k}</Kbd>
        ))}
      </div>
    </div>
  );
}

export function EditorShortcutsEmpty() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div
          className="inline-flex size-16 items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/40 text-zinc-700"
          aria-hidden
        >
          <span className="text-2xl font-black tracking-tighter">V0</span>
        </div>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Try the v0 iOS app for building on the go
        </p>

        <div className="my-5 h-px w-full bg-zinc-800/60" aria-hidden />

        <div className="w-full">
          <ShortcutRow label="Go to File" keys={["\u2318", "P"]} />
          <ShortcutRow
            label="Find in Files"
            keys={["\u21E7", "\u2318", "F"]}
          />
          <ShortcutRow
            label="Command Palette"
            keys={["\u21E7", "\u2318", "P"]}
          />
          <ShortcutRow label="Terminal" keys={["^", "`"]} />
        </div>
      </div>
    </div>
  );
}
