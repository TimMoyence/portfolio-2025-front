import { FpBlock } from './FpBlock';
import { estObjet } from './retours';

export abstract class FpContenu<Contenu extends { readonly id: string }> extends FpBlock {
  protected interne: Contenu | null = null;

  protected abstract repartirDeZero(): void;

  protected poserLeContenu(valeur: Contenu | null, copier: (source: Contenu) => Contenu): void {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : copier(valeur);
    if (change) {
      this.repartirDeZero();
    }
  }
}

export abstract class FpEnvoi<Contenu extends { readonly id: string }> extends FpContenu<Contenu> {
  protected message = '';
  protected envoye = false;

  protected abstract effacerLaSaisie(): void;

  protected abstract reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean;

  set brouillon(valeur: unknown) {
    if (estObjet(valeur) && this.accepteLeBrouillon() && this.reprendreLeBrouillon(valeur)) {
      this.noterBrouillonRepris();
      this.refreshSiConnecte();
    }
  }

  protected accepteLeBrouillon(): boolean {
    return !this.envoye;
  }

  protected repartirDeZero(): void {
    this.effacerLaSaisie();
    this.message = '';
    this.envoye = false;
  }

  protected verdictRecu(): boolean {
    return false;
  }

  protected verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.envoye, this.verdictRecu());
  }

  protected brancherLaSaisie(
    racine: ShadowRoot,
    cibles: { readonly champ: string; readonly bouton: string; readonly verrouille: boolean },
    reactions: {
      readonly saisir: (valeur: string) => void;
      readonly envoyer: (valeur: string) => void;
    },
  ): boolean {
    const champ = racine.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[data-testid="${cibles.champ}"]`,
    );
    const bouton = racine.querySelector<HTMLButtonElement>(`[data-testid="${cibles.bouton}"]`);
    if (champ === null || bouton === null) {
      return false;
    }
    champ.disabled = cibles.verrouille;
    bouton.disabled = cibles.verrouille;
    champ.addEventListener('input', () => reactions.saisir(champ.value));
    bouton.addEventListener('click', () => reactions.envoyer(champ.value));
    return true;
  }

  protected refuserLEnvoi(motif: string): void {
    this.message = motif;
    this.refresh();
  }

  protected conclureLEnvoi(evenement: string, detail: Readonly<Record<string, unknown>>): void {
    this.envoye = true;
    this.message = this.messageApresEnvoi();
    this.emit(evenement, { ...detail, dureeMs: this.depuisAffichage() });
    this.refresh();
  }
}
