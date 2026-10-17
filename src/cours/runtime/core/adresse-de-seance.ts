export function urlDeLaSeance(baseUrl: string, seance: string): string {
  return `${baseUrl}/sessions/${encodeURIComponent(seance)}`;
}
