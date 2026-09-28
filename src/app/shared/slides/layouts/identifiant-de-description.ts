export function generateurDIdentifiants(prefixe: string): () => string {
  let compteur = 0;
  return () => {
    compteur += 1;
    return `${prefixe}-description-${compteur}`;
  };
}
