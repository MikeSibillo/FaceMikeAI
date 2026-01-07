"use client";

import { ReactNode, useEffect } from "react";

export function BottomSheet(props: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { open, onClose, title, children } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "grid",
        alignItems: "end"
      }}
    >
      <div
        className="card"
        style={{
          borderRadius: "24px 24px 0 0",
          borderBottom: "0",
          padding: 16,
          maxHeight: "75vh",
          overflow: "auto"
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button className="btn small" onClick={onClose}>
            Chiudi
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

