export function deuxImages(): Promise<void> {
  return new Promise((suite) => requestAnimationFrame(() => requestAnimationFrame(() => suite())));
}
