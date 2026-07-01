export type Urgenza = "bassa" | "media" | "alta";
export type Rischio = "basso" | "medio" | "alto";
export type EsitoValore = "positivo" | "neutro" | "negativo" | "sconosciuto";

export type ConstraintType = "max_options" | "cooldown_hours" | "budget_max" | "testo";

export type Vincolo = {
  id: string;
  createdAt: number;
  updatedAt: number;
  type: ConstraintType;
  nome: string;
  valore: string; // string for simplicity; parse based on type
};

export type DecisionOption = {
  id: string;
  titolo: string;
  descrizione: string;
};

export type DecisionEsito = {
  valore: EsitoValore;
  note?: string;
  at: number;
};

export type Decisione = {
  id: string;
  createdAt: number;
  updatedAt: number;
  categoria?: string;

  contesto: string;
  obiettivo: string;
  vincoli: Vincolo[];
  urgenza: Urgenza;
  rischio: Rischio;

  opzioni: DecisionOption[];
  sceltaOptionId?: string;
  esito?: DecisionEsito;

  // quick AI placeholder score (saved for history)
  score?: number;
};

export type TicketStato = "aperto" | "chiuso";

export type TicketEscalation = {
  id: string;
  createdAt: number;
  updatedAt: number;
  stato: TicketStato;
  decisionId?: string;

  riassunto: string;
  contesto: string;
  obiettivo: string;
  vincoli: Vincolo[];
  opzioni: DecisionOption[];
};

