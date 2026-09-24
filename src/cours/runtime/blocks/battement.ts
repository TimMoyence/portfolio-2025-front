export const SECONDE_MS = 1000;

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
