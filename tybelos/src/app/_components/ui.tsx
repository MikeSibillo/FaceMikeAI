import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-3xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="text-sm font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">
      {children}
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <div className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none",
        "focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-28 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base outline-none",
        "focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base outline-none",
        "focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold tracking-tight transition active:translate-y-[1px] disabled:opacity-60 disabled:active:translate-y-0";
  const styles =
    variant === "primary"
      ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white"
      : variant === "secondary"
        ? "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
        : variant === "danger"
          ? "bg-red-600 text-white hover:bg-red-700"
          : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900/50";

  return (
    <button {...props} className={[base, styles, props.className ?? ""].join(" ")}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
        : tone === "danger"
          ? "bg-red-500/15 text-red-700 dark:text-red-300"
          : "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300";
  return (
    <span className={["inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold", cls].join(" ")}>
      {children}
    </span>
  );
}

