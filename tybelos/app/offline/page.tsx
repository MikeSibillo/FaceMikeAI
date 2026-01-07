export default function OfflinePage() {
  return (
    <div className="container">
      <div className="card" style={{ padding: 18 }}>
        <h1 className="title">Offline</h1>
        <p className="subtitle">
          Sei offline. Le pagine base dovrebbero essere disponibili in cache. I tuoi dati restano sul dispositivo (IndexedDB).
        </p>
        <div className="notice" style={{ marginTop: 14 }}>
          Se è la prima volta che apri Tybelos su questo dispositivo, serve una visita online per “riempire” la cache.
        </div>
      </div>
    </div>
  );
}

