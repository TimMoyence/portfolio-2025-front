import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';

export interface WorkedEtape {
  readonly id: string;
  readonly intitule: string;
  readonly raisonnement: string;
  readonly invite: string;
}

export interface WorkedExemple {
  readonly id: string;
  readonly enonce: string;
  readonly etapes: readonly WorkedEtape[];
  readonly metadonnees: MetadonneesBrique;
}

type Champs = Readonly<Record<string, string>>;

function copierEtape(etape: WorkedEtape): WorkedEtape {
  return {
    id: etape.id,
    intitule: etape.intitule,
    raisonnement: etape.raisonnement,
    invite: etape.invite,
  };
}

function remplis(champs: Champs): Record<string, string> {
  return Object.fromEntries(
    Object.entries(champs).filter(([, valeur]) => valeur.trim().length > 0),
  );
}

export class FpWorked extends FpBlock {
  private interne: WorkedExemple | null = null;
  private montrees = 0;
  private redactions: Champs = {};
  private explications: Champs = {};
  private message = '';
  private soumise = false;

  set exemple(valeur: WorkedExemple | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            enonce: valeur.enonce,
            etapes: valeur.etapes.map(copierEtape),
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    if (change) {
      this.montrees = this.total();
      this.redactions = {};
      this.explications = {};
      this.message = '';
      this.soumise = false;
    }
    this.refreshSiConnecte();
  }

  get exemple(): WorkedExemple | null {
    const source = this.interne;
    if (source === null) {
      return null;
    }
    return {
      id: source.id,
      enonce: source.enonce,
      etapes: source.etapes.map((etape, rang) => this.projeterEtape(etape, rang)),
      metadonnees: projeterMetadonnees(source.metadonnees),
    };
  }

  set etayage(valeur: number) {
    this.montrees = Math.min(this.borner(valeur), this.montrees);
    this.refreshSiConnecte();
  }

  get etayage(): number {
    return this.montrees;
  }

  renderHand(): EscapedHtml {
    const exemple = this.exemple;
    if (exemple === null) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-worked__exemple">
        <p class="fp-worked__enonce" data-testid="enonce">${escapeHtml(exemple.enonce)}</p>
        <p class="fp-worked__consigne">${escapeHtml(this.texte('worked-consigne'))}</p>
        <ol class="fp-worked__etapes">${exemple.etapes.map((etape, rang) => this.etape(etape, rang))}</ol>
        <button type="button" class="fp-worked__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        <p class="fp-worked__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
      </section>
    `;
  }

  renderStage(): EscapedHtml {
    const exemple = this.exemple;
    if (exemple === null) {
      return safeHtml``;
    }
    return safeHtml`
      <section class="fp-scene fp-worked__exemple">
        <p class="fp-enonce" data-testid="enonce">${escapeHtml(exemple.enonce)}</p>
        <ol class="fp-worked__etapes">${exemple.etapes.slice(0, this.montrees).map((etape) => this.etapeMontree(etape))}</ol>
      </section>
    `;
  }

  renderBoard(): EscapedHtml {
    const exemple = this.exemple;
    if (exemple === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = exemple.metadonnees;
    return safeHtml`
      <section class="fp-carte fp-worked__exemple">
        <p class="fp-enonce" data-testid="enonce">${escapeHtml(exemple.enonce)}</p>
        <p class="fp-worked__niveau" data-testid="niveau" data-niveau="${this.montrees}">${escapeHtml(this.texte('worked-niveau'))} ${this.montrees} / ${this.total()}</p>
        <p class="fp-badge" data-testid="modalite">${escapeHtml(metadonnees.modalite)}</p>
        <p class="fp-badge" data-testid="duree">${metadonnees.dureeMinutes} min</p>
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    for (const champ of racine.querySelectorAll<HTMLTextAreaElement>('textarea[data-etape]')) {
      const cle = champ.dataset['etape'] ?? '';
      const explication = champ.dataset['testid'] === 'explication';
      champ.disabled = this.soumise;
      champ.addEventListener('input', () => this.noter(explication, cle, champ.value));
    }
    const valider = racine.querySelector<HTMLButtonElement>('[data-testid="valider"]');
    if (valider !== null) {
      valider.disabled = this.soumise;
      valider.addEventListener('click', () => this.valider());
    }
  }

  private total(): number {
    return this.interne?.etapes.length ?? 0;
  }

  private borner(valeur: number): number {
    if (!Number.isFinite(valeur)) {
      return this.montrees;
    }
    return Math.min(Math.max(Math.trunc(valeur), 0), this.total());
  }

  private projeterEtape(etape: WorkedEtape, rang: number): WorkedEtape {
    if (rang < this.montrees || this.roleActuel() === 'presentateur') {
      return copierEtape(etape);
    }
    return { ...copierEtape(etape), raisonnement: '' };
  }

  private etape(etape: WorkedEtape, rang: number): EscapedHtml {
    const resolue = rang < this.montrees;
    return safeHtml`
      <li class="fp-worked__etape" data-testid="etape" data-etape="${escapeHtml(etape.id)}" data-resolue="${escapeHtml(String(resolue))}">
        <p class="fp-worked__intitule">${escapeHtml(etape.intitule)}</p>
        ${resolue ? this.raisonnement(etape) : this.redaction(etape)}
        ${this.invite(etape)}
      </li>
    `;
  }

  private etapeMontree(etape: WorkedEtape): EscapedHtml {
    return safeHtml`
      <li class="fp-worked__etape" data-testid="etape" data-etape="${escapeHtml(etape.id)}" data-resolue="true">
        <p class="fp-worked__intitule">${escapeHtml(etape.intitule)}</p>
        ${this.raisonnement(etape)}
      </li>
    `;
  }

  private raisonnement(etape: WorkedEtape): EscapedHtml {
    return safeHtml`<p class="fp-worked__raisonnement" data-testid="raisonnement" data-etape="${escapeHtml(etape.id)}">${escapeHtml(etape.raisonnement)}</p>`;
  }

  private redaction(etape: WorkedEtape): EscapedHtml {
    const identifiant = `fp-worked-saisie-${etape.id}`;
    return safeHtml`
      <label class="fp-worked__demande" for="${escapeHtml(identifiant)}">${escapeHtml(this.texte('worked-a-vous'))}</label>
      <textarea class="fp-worked__champ" id="${escapeHtml(identifiant)}" data-testid="saisie" data-etape="${escapeHtml(etape.id)}" rows="3">${escapeHtml(this.redactions[etape.id] ?? '')}</textarea>
    `;
  }

  private invite(etape: WorkedEtape): EscapedHtml {
    const identifiant = `fp-worked-explication-${etape.id}`;
    const question = etape.invite.trim().length > 0 ? etape.invite : this.texte('worked-pourquoi');
    return safeHtml`
      <label class="fp-worked__invite" for="${escapeHtml(identifiant)}">${escapeHtml(question)}</label>
      <textarea class="fp-worked__champ" id="${escapeHtml(identifiant)}" data-testid="explication" data-etape="${escapeHtml(etape.id)}" rows="2">${escapeHtml(this.explications[etape.id] ?? '')}</textarea>
    `;
  }

  private noter(explication: boolean, cle: string, valeur: string): void {
    if (explication) {
      this.explications = { ...this.explications, [cle]: valeur };
      return;
    }
    this.redactions = { ...this.redactions, [cle]: valeur };
  }

  private aCompleter(): readonly WorkedEtape[] {
    return this.interne?.etapes.slice(this.montrees) ?? [];
  }

  private valider(): void {
    const exemple = this.interne;
    if (exemple === null || this.soumise) {
      return;
    }
    const manquante = this.aCompleter().some(
      (etape) => (this.redactions[etape.id] ?? '').trim().length === 0,
    );
    if (manquante) {
      this.message = this.texte('worked-etape-vide');
      this.refresh();
      return;
    }
    this.soumise = true;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-worked-submit', {
      exempleId: exemple.id,
      etayage: this.montrees,
      etayageSuivant: Math.max(0, this.montrees - 1),
      redactions: remplis(this.redactions),
      explications: remplis(this.explications),
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
