import type { ReactNode } from "react";
import { BootstrapClient } from "@/app/_components/BootstrapClient";
import { BottomSheetNav } from "@/app/_components/BottomSheetNav";
import { SidebarNav } from "@/app/_components/SidebarNav";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tyb-shell min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <BootstrapClient />
      <aside className="tyb-sidebar border-r border-zinc-200/70 bg-white/70 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/40">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-tight">Tybelos</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Decision OS · iPad-first
            </span>
          </div>
        </div>
        <SidebarNav />
        <div className="mt-auto px-5 pb-5 pt-3 text-xs text-zinc-500 dark:text-zinc-500">
          Offline-ready · Dati locali (IndexedDB)
        </div>
      </aside>

      <main className="tyb-main">
        <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-6 md:pb-10">
          {children}
        </div>
      </main>

      <BottomSheetNav />
    </div>
  );
}

