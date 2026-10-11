export type Ecoute<T> = (valeur: T) => void;

export function diffuserA<T>(ecoutes: ReadonlySet<Ecoute<T>>, valeur: T): void {
  for (const ecoute of ecoutes) {
    ecoute(valeur);
  }
}

export function abonner<T>(ecoutes: Set<Ecoute<T>>, ecoute: Ecoute<T>): () => void {
  ecoutes.add(ecoute);
  return () => {
    ecoutes.delete(ecoute);
  };
}
