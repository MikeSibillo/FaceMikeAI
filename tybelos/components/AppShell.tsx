"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ensureSeedData } from "@/lib/repo";

type NavItem = { href: string; label: string; short: string };

const NAV: NavItem[] = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/new", label: "Nuova decisione", short: "Nuova" },
  { href: "/log", label: "Log decisionale", short: "Log" },
  { href: "/constraints", label: "Vincoli", short: "Vincoli" },
  { href: "/tickets", label: "Escalation", short: "Ticket" }
];

function useIsLandscapeTablet() {
  const [is, setIs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (min-width: 900px)");
    const update = () => setIs(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return is;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="grid" style={{ gap: 10 }}>
      {NAV.map((i) => {
        const active = pathname === i.href || (i.href !== "/" && pathname?.startsWith(i.href));
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={onNavigate}
            className="btn"
            style={{
              justifyContent: "flex-start",
              background: active ? "rgba(124,92,255,0.22)" : undefined,
              borderColor: active ? "rgba(124,92,255,0.38)" : undefined
            }}
          >
            <span style={{ fontWeight: 700 }}>{i.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const isLandscape = useIsLandscapeTablet();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    // seed default constraints on first run
    ensureSeedData().catch(() => {});
  }, []);

  useEffect(() => {
    // close menu on navigation
    setSheetOpen(false);
  }, [pathname]);

  const title = useMemo(() => {
    const item = NAV.find((n) => n.href === pathname) ?? NAV.find((n) => n.href !== "/" && pathname?.startsWith(n.href));
    return item?.label ?? "Tybelos";
  }, [pathname]);

  if (isLandscape) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "320px 1fr"
        }}
      >
        <aside
          style={{
            padding: 18,
            borderRight: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            height: "100vh"
          }}
        >
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Tybelos</div>
              <div className="subtitle">Decision OS (tablet-first)</div>
            </div>
            <ThemeToggle />
          </div>
          <NavList />
          <div className="notice" style={{ marginTop: 14 }}>
            Offline: le pagine base sono in cache. Dati locali: IndexedDB.
          </div>
        </aside>
        <main>{children}</main>
      </div>
    );
  }

  // Portrait / small: top bar + bottom sheet menu
  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(10px)",
          background: "rgba(0,0,0,0.35)",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <div className="container" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Tybelos</div>
              <div className="subtitle">{title}</div>
            </div>
            <div className="row">
              <ThemeToggle />
              <button className="btn small" onClick={() => setSheetOpen(true)} aria-label="Apri menu">
                Menu
              </button>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Navigazione">
        <NavList onNavigate={() => setSheetOpen(false)} />
      </BottomSheet>
    </>
  );
}

