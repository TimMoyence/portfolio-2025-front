export const SECONDE_MS = 1000;
export const MINUTE_MS = 60 * SECONDE_MS;

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
