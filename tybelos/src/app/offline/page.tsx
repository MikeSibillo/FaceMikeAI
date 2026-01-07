export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Sei offline
        </h1>
        <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
          Tybelos è disponibile anche senza rete per le pagine principali. Alcune
          funzioni potrebbero richiedere connessione (es. API predittiva).
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Suggerimento: torna online e ricarica per sincronizzare la cache.
        </p>
      </div>
    </div>
  );
}

