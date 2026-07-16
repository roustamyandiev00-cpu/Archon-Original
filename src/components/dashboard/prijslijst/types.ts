export type PrijslijstPickItem = {
  id: number;
  omschrijving: string;
  eenheid: string;
  prijs: number;
  btwPercentage: number;
  categorie: string | null;
};
