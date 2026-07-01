"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = "system" | "light" | "dark";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
    return;
  }
  root.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("tybelos-theme") as Theme | null) ?? "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("tybelos-theme", theme);
    applyTheme(theme);
  }, [theme]);

  const label = useMemo(() => {
    if (theme === "system") return "Tema: Sistema";
    if (theme === "light") return "Tema: Chiaro";
    return "Tema: Scuro";
  }, [theme]);

  return (
    <button
      className="btn small"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme((t) => (t === "system" ? "light" : t === "light" ? "dark" : "system"));
      }}
    >
      {theme === "dark" ? "Scuro" : theme === "light" ? "Chiaro" : "Sistema"}
    </button>
  );
}

