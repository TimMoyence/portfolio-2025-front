import { FpEnvoi } from './contenu';
import { lireTextes } from './retours';

interface ReactionsDeZone {
  readonly apresSaisie?: () => void;
  readonly aLaSortie?: (cle: string) => void;
}

export abstract class FpRedaction<
  Contenu extends { readonly id: string },
> extends FpEnvoi<Contenu> {
  private textes: Readonly<Record<string, string>> = {};

  protected abstract readonly cleDuBrouillon: string;

  protected reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean {
    this.textes = lireTextes(brouillon[this.cleDuBrouillon]);
    return true;
  }

  protected effacerLaSaisie(): void {
    this.textes = {};
  }

  protected texteDe(cle: string): string {
    return this.textes[cle] ?? '';
  }

  protected textesDe(cles: readonly string[]): Record<string, string> {
    return Object.fromEntries(cles.map((cle) => [cle, this.texteDe(cle)]));
  }

  protected manqueUnTexte(cles: readonly string[]): boolean {
    return cles.some((cle) => this.texteDe(cle).trim().length === 0);
  }

  protected noter(cle: string, valeur: string): void {
    this.textes = { ...this.textes, [cle]: valeur };
    this.signalerBrouillon(this.interne?.id ?? '', { [this.cleDuBrouillon]: this.textes });
  }

  protected brancherLesZones(
    racine: ShadowRoot,
    attribut: string,
    verrouille: boolean,
    reactions: ReactionsDeZone = {},
  ): void {
    for (const zone of racine.querySelectorAll<HTMLTextAreaElement>(`textarea[${attribut}]`)) {
      const cle = zone.getAttribute(attribut) ?? '';
      zone.disabled = verrouille;
      zone.addEventListener('input', () => {
        this.noter(cle, zone.value);
        reactions.apresSaisie?.();
      });
      const quitter = reactions.aLaSortie;
      if (quitter !== undefined) {
        zone.addEventListener('change', () => quitter(cle));
      }
    }
  }
}
