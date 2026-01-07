"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/app/_components/navItems";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="px-3 pb-3">
      <ul className="flex flex-col gap-2">
        {navItems.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-base",
                  "transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950"
                    : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900/50",
                ].join(" ")}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium tracking-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

