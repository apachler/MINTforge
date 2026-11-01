// Markendaten für die Website, direkt aus brand/tokens.json (der einzigen Quelle).
import tokens from "../../brand/tokens.json";

type Bereich = {
  name: string;
  faecher: string;
  beschreibung: string;
  bild: string;
  website: boolean;
  farben: Record<string, string>;
};

export const marke = tokens.marke;
export const farben = tokens.farben as Record<string, Record<string, string>>;
export const schrift = tokens.schrift;

export const bereiche = Object.entries(tokens.bereiche as Record<string, Bereich>).map(([key, b]) => ({ key, ...b }));
export const websiteBereiche = bereiche.filter((b) => b.website);
export type BereichKey = "blaupause" | "labor" | "biom" | "schaltwerk";

/** Farbgruppen ohne Kommentarfelder ($...) */
export function eintraege(gruppe: Record<string, string>): [string, string][] {
  return Object.entries(gruppe).filter(([k]) => !k.startsWith("$"));
}
