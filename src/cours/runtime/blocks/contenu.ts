import { FpBlock } from './FpBlock';
import { estObjet } from '../core/valeurs';

interface CiblesDeSaisie {
  readonly champ: string;
  readonly bouton: string;
}

interface ReactionsDeSaisie {
  readonly saisir: (valeur: string) => void;
  readonly envoyer: (valeur: string) => void;
}

interface SaisieBranchee {
  readonly champ: HTMLInputElement | HTMLTextAreaElement;
  readonly bouton: HTMLButtonElement;
}

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

  protected brancherLeChamp(
    racine: ShadowRoot,
    cibles: CiblesDeSaisie,
    reactions: ReactionsDeSaisie,
  ): SaisieBranchee | null {
    const champ = racine.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[data-testid="${cibles.champ}"]`,
    );
    const bouton = racine.querySelector<HTMLButtonElement>(`[data-testid="${cibles.bouton}"]`);
    if (champ === null || bouton === null) {
      return null;
    }
    champ.addEventListener('input', () => reactions.saisir(champ.value));
    bouton.addEventListener('click', () => reactions.envoyer(champ.value));
    if (champ instanceof HTMLInputElement) {
      champ.addEventListener('keydown', (evenement) => {
        if (evenement.key === 'Enter') {
          evenement.preventDefault();
          reactions.envoyer(champ.value);
        }
      });
    }
    return { champ, bouton };
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
    cibles: CiblesDeSaisie & { readonly verrouille: boolean },
    reactions: ReactionsDeSaisie,
  ): boolean {
    const saisie = this.brancherLeChamp(racine, cibles, reactions);
    if (saisie === null) {
      return false;
    }
    saisie.champ.disabled = cibles.verrouille;
    saisie.bouton.disabled = cibles.verrouille;
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
