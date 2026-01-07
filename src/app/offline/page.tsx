export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-3xl p-6 md:p-10">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="text-2xl font-semibold">Offline</h1>
        <p className="mt-2 text-slate-300">
          Sei offline. Le schermate base sono disponibili in cache; alcune azioni
          (come la “score” dall’API stub) potrebbero non funzionare fino al
          ritorno della connessione.
        </p>
      </div>
    </main>
  );
}

