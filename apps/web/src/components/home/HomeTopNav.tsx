import { Bell, Gift, LayoutGrid, MonitorSmartphone } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

function Avatar({
  className,
  initials = "J",
}: {
  className?: string;
  initials?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-600 text-sm font-semibold text-white",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function HomeTopNav() {
  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-[#1b1b1e] bg-[#0e0e11] px-4 text-sm text-white">
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#45f4ff] px-3 py-1.5 text-xs font-semibold text-black transition-all duration-200 ease-in-out">
          <MonitorSmartphone className="size-4" strokeWidth={2.25} />
          <span>App builder</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-[#1b1b1e] p-2 text-zinc-300 transition-all duration-200 ease-in-out hover:bg-zinc-800"
          aria-label="Preview"
        >
          <MonitorSmartphone className="size-4" />
        </button>

        <div className="ml-2 flex items-center gap-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-[#1b1b1e] px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 ease-in-out"
          >
            <LayoutGrid className="size-3.5" />
            Home
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 transition-all duration-200 ease-in-out hover:bg-[#1b1b1e] hover:text-white"
          >
            <span className="inline-block size-1.5 rounded-full bg-zinc-500" />
            trackit-75
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-[#fdf6b2] px-4 py-1.5 text-xs font-semibold text-black transition-all duration-200 ease-in-out hover:opacity-90"
        >
          Buy Credits
        </button>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full bg-[#1b1b1e] text-zinc-300 transition-all duration-200 ease-in-out hover:bg-zinc-800"
          aria-label="Gifts"
        >
          <Gift className="size-4" />
        </button>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full bg-[#1b1b1e] text-zinc-300 transition-all duration-200 ease-in-out hover:bg-zinc-800"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
        <Avatar />
      </div>
    </header>
  );
}
