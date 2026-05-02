import { cn } from "@/lib/utils";

export function PromoBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#56ccf2] to-[#2f80ed] py-1.5 pl-1.5 pr-2 text-sm shadow-[0_8px_32px_rgba(47,128,237,0.25)]",
        className,
      )}
      role="status"
    >
      <span
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-black/40 text-base"
        aria-hidden
      >
        {"\u{1F412}"}
      </span>
      <span className="font-semibold text-white">
        FLAT 85% off on Standard monthly plan.
      </span>
      <span className="inline-flex items-center rounded-full bg-[#0e0e11] px-3 py-1.5 text-xs font-semibold text-white">
        Discount auto applied
      </span>
    </div>
  );
}
