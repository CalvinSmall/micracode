import { Calendar, Layers, Receipt, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const CHIPS: { id: string; label: string; icon: React.ElementType; beta?: boolean }[] = [
  { id: "wingman", label: "Wingman", icon: Layers, beta: true },
  { id: "counter-part", label: "My Counter Part", icon: Users },
  { id: "bill-generator", label: "Bill Generator", icon: Receipt },
  { id: "word-of-the-day", label: "Word of the Day", icon: Calendar },
];

export function FeatureChips({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {CHIPS.map((chip) => {
        const Icon = chip.icon;
        return (
          <button
            key={chip.id}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#333336] bg-[#1b1b1e] px-3.5 py-2 text-xs font-medium text-white transition-all duration-200 ease-in-out hover:bg-zinc-800"
          >
            <Icon className="size-3.5 text-zinc-400" />
            <span>{chip.label}</span>
            {chip.beta ? (
              <span className="inline-flex items-center rounded-full bg-[#45f4ff] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-black">
                Beta
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
