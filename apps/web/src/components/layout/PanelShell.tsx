import { cn } from "@/lib/utils";

export interface PanelShellProps {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Shared chrome for the three workspace panels. */
export function PanelShell({ title, right, children, className }: PanelShellProps) {
  return (
    <section className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span>{title}</span>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
