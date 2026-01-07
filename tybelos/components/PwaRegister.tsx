"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        setStatus("ok");
      } catch {
        setStatus("fail");
      }
    };

    register();
  }, []);

  if (status === "fail") {
    return (
      <div className="notice" style={{ margin: "12px var(--pad-lg) 0" }}>
        Service worker non attivo: la modalità offline potrebbe non funzionare.
      </div>
    );
  }

  return null;
}

