export const SECONDE_MS = 1000;
const MINUTE_MS = 60 * SECONDE_MS;

export function formaterChrono(dureeMs: number): string {
  const secondes = Math.ceil(dureeMs / SECONDE_MS);
  const minutes = Math.floor((secondes * SECONDE_MS) / MINUTE_MS);
  return `${minutes}:${String(secondes % 60).padStart(2, '0')}`;
}

export class Battement {
  private minuteur: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly battre: () => void) {}

  demarrer(): void {
    this.minuteur ??= setInterval(this.battre, SECONDE_MS);
  }

  arreter(): void {
    if (this.minuteur !== null) {
      clearInterval(this.minuteur);
      this.minuteur = null;
    }
  }
}
