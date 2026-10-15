export function uneImage(): Promise<void> {
  return new Promise((suite) => requestAnimationFrame(() => suite()));
}

export async function deuxImages(): Promise<void> {
  await uneImage();
  await uneImage();
}
