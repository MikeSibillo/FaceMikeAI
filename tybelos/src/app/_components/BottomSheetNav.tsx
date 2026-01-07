"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { navItems } from "@/app/_components/navItems";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomSheetNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const primary = useMemo(() => navItems.slice(0, 3), []);
  const secondary = useMemo(() => navItems.slice(3), []);

  return (
    <>
      <div className="tyb-bottomnav fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2">
          {primary.map(({ href, shortLabel, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/50",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                <span>{shortLabel}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-12 w-28 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-sm active:translate-y-[1px]"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Chiudi"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-zinc-200/70 bg-white p-4 shadow-2xl dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div className="text-base font-semibold tracking-tight">
                Menu rapido
              </div>
              <button
                type="button"
                className="min-h-12 rounded-2xl px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/50"
                onClick={() => setOpen(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {secondary.map(({ href, label, Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-base font-medium",
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                        : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40",
                    ].join(" ")}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

