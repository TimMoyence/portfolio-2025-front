export function enteteDAutorisation(jeton: string | null): Readonly<Record<string, string>> {
  return jeton ? { authorization: `Bearer ${jeton}` } : {};
}
