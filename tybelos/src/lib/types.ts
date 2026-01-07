export type Urgenza = "bassa" | "media" | "alta";
export type Rischio = "basso" | "medio" | "alto";

export type Esito = {
  stato: "sconosciuto" | "positivo" | "neutro" | "negativo";
  nota?: string;
  timestamp?: number;
};

export type ConstraintKind = "max_options" | "cooldown_hours" | "budget_max" | "custom";

export type Constraint = {
  id: string;
  nome: string;
  kind: ConstraintKind;
  valore?: number;
  unita?: string;
  descrizione?: string;
  createdAt: number;
  updatedAt: number;
};

export type ProposedOption = {
  id: string;
  titolo: string;
  descrizione?: string;
  score?: number;
};

export type Decision = {
  id: string;
  categoria?: string;
  contesto: string;
  obiettivo: string;
  urgenza: Urgenza;
  rischio: Rischio;
  vincoliIds: string[];
  vincoliSnapshot?: Pick<Constraint, "id" | "nome" | "kind" | "valore" | "unita">[];
  opzioni: ProposedOption[];
  scelta?: { optionId: string; timestamp: number };
  esito?: Esito;
  createdAt: number;
  updatedAt: number;
};

export type Ticket = {
  id: string;
  stato: "aperto" | "chiuso";
  riassunto: string;
  contesto: string;
  obiettivo: string;
  opzioni: Pick<ProposedOption, "id" | "titolo">[];
  vincoli: Pick<Constraint, "id" | "nome" | "kind" | "valore" | "unita">[];
  createdAt: number;
  updatedAt: number;
};

