import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Tybelos
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
          Un <span className="font-semibold">Decision OS</span> che riduce il
          carico decisionale: mostra al massimo 1–2 opzioni, registra
          scelta+esito e costruisce coerenza nel tempo.
        </p>
      </header>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">
          Flusso
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          {["Contesto", "Proposta", "Scelta", "Esito"].map((step, idx) => (
            <div
              key={step}
              className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-4 dark:bg-zinc-900/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950">
                  {idx + 1}
                </div>
                <div className="text-base font-semibold tracking-tight">
                  {step}
                </div>
              </div>
              <div className="text-zinc-400">→</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/decisioni/nuova"
          className="flex min-h-16 items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 px-6 py-5 text-white shadow-sm active:translate-y-[1px]"
        >
          <div className="flex flex-col gap-1">
            <div className="text-lg font-semibold tracking-tight">
              Nuova decisione
            </div>
            <div className="text-sm text-white/90">
              Inserisci contesto, obiettivo e vincoli. Tybelos propone 1–2 opzioni.
            </div>
          </div>
          <div className="text-2xl">+</div>
        </Link>

        <div className="grid grid-cols-1 gap-4">
          <Link
            href="/log"
            className="flex min-h-16 items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white px-6 py-5 text-zinc-900 hover:bg-zinc-50 active:translate-y-[1px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
          >
            <div className="flex flex-col gap-1">
              <div className="text-lg font-semibold tracking-tight">
                Log decisionale
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Filtra per categoria, data ed esito. Apri il dettaglio.
              </div>
            </div>
            <div className="text-xl">→</div>
          </Link>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/vincoli"
              className="flex min-h-16 items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white px-5 py-5 text-zinc-900 hover:bg-zinc-50 active:translate-y-[1px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
            >
              <div>
                <div className="text-base font-semibold tracking-tight">
                  Vincoli
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  CRUD
                </div>
              </div>
              <div className="text-xl">⚙︎</div>
            </Link>

            <Link
              href="/escalation"
              className="flex min-h-16 items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white px-5 py-5 text-zinc-900 hover:bg-zinc-50 active:translate-y-[1px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900/40"
            >
              <div>
                <div className="text-base font-semibold tracking-tight">
                  Assistente umano
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  Ticket locali
                </div>
              </div>
              <div className="text-xl">⚑</div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

