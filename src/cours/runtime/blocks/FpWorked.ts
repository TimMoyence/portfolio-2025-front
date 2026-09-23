import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import { estObjet } from './retours';

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

function lireChamps(valeur: unknown): Champs {
  if (!estObjet(valeur)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(valeur).filter(
      (entree): entree is [string, string] => typeof entree[1] === 'string',
    ),
  );
}

export class FpWorked extends FpBlock {
  private interne: WorkedExemple | null = null;
  private montrees = 0;
  private redactions: Champs = {};
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
      this.montrees = 0;
      this.redactions = {};
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

  set etayage(valeur: number | null | undefined) {
    if (typeof valeur === 'number') {
      this.montrees = this.borner(valeur);
      this.refreshSiConnecte();
    }
  }

  get etayage(): number {
    return this.montrees;
  }

  set brouillon(valeur: unknown) {
    if (!estObjet(valeur) || this.soumise) {
      return;
    }
    this.redactions = lireChamps(valeur['redactions']);
    this.noterBrouillonRepris();
    this.refreshSiConnecte();
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
        ${this.annonces()}
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
        <ol class="fp-worked__etapes">${exemple.etapes.map((etape, rang) => this.etapeProjetee(etape, rang))}</ol>
      </section>
    `;
  }

  renderBoard(): EscapedHtml {
    const exemple = this.exemple;
    if (exemple === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    return safeHtml`
      <section class="fp-carte fp-worked__exemple">
        <p class="fp-enonce" data-testid="enonce">${escapeHtml(exemple.enonce)}</p>
        <p class="fp-worked__niveau" data-testid="niveau" data-niveau="${this.montrees}">${escapeHtml(this.texte('worked-niveau'))} ${this.montrees} / ${this.total()}</p>
        <p class="fp-reperes">${this.reperes(exemple.metadonnees)}</p>
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    const verrouille = this.verrouilleApresEnvoi(this.soumise, false);
    for (const champ of racine.querySelectorAll<HTMLTextAreaElement>('textarea[data-etape]')) {
      const cle = champ.dataset['etape'] ?? '';
      champ.disabled = verrouille;
      champ.addEventListener('input', () => this.noter(cle, champ.value));
      champ.addEventListener('change', () => this.envoyerEtape(cle));
    }
    const valider = racine.querySelector<HTMLButtonElement>('[data-testid="valider"]');
    if (valider !== null) {
      valider.disabled = verrouille || this.aCompleter().length === 0;
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
        ${resolue ? this.saisieFigee(etape) : this.redaction(etape)}
        ${resolue ? this.correction(etape) : safeHtml``}
      </li>
    `;
  }

  private correction(etape: WorkedEtape): EscapedHtml {
    return safeHtml`
      <p class="fp-worked__demande" data-testid="correction">${escapeHtml(this.texte('worked-correction'))}</p>
      ${this.raisonnement(etape)}
    `;
  }

  private etapeProjetee(etape: WorkedEtape, rang: number): EscapedHtml {
    const resolue = rang < this.montrees;
    return safeHtml`
      <li class="fp-worked__etape" data-testid="etape" data-etape="${escapeHtml(etape.id)}" data-resolue="${escapeHtml(String(resolue))}">
        <p class="fp-worked__intitule">${escapeHtml(etape.intitule)}</p>
        <p class="fp-worked__invite" data-testid="question">${escapeHtml(etape.invite)}</p>
        ${resolue ? this.correction(etape) : safeHtml``}
      </li>
    `;
  }

  private raisonnement(etape: WorkedEtape): EscapedHtml {
    return safeHtml`<p class="fp-worked__raisonnement" data-testid="raisonnement" data-etape="${escapeHtml(etape.id)}">${escapeHtml(etape.raisonnement)}</p>`;
  }

  private redaction(etape: WorkedEtape): EscapedHtml {
    const identifiant = `fp-worked-saisie-${etape.id}`;
    return safeHtml`
      <label class="fp-worked__invite" for="${escapeHtml(identifiant)}">${escapeHtml(etape.invite)}</label>
      <textarea class="fp-worked__champ" id="${escapeHtml(identifiant)}" data-testid="saisie" data-etape="${escapeHtml(etape.id)}" rows="3">${escapeHtml(this.redactions[etape.id] ?? '')}</textarea>
    `;
  }

  private saisieFigee(etape: WorkedEtape): EscapedHtml {
    return safeHtml`
      <p class="fp-worked__invite">${escapeHtml(etape.invite)}</p>
      <p class="fp-worked__reponse" data-testid="saisie-figee" data-etape="${escapeHtml(etape.id)}">${escapeHtml(this.redactions[etape.id] ?? '')}</p>
    `;
  }

  private envoyerEtape(cle: string): void {
    const exemple = this.interne;
    const texte = (this.redactions[cle] ?? '').trim();
    if (exemple === null || texte.length === 0 || this.verrouilleApresEnvoi(this.soumise, false)) {
      return;
    }
    this.emit('fp-worked-submit', {
      exempleId: exemple.id,
      redactions: { [cle]: texte },
      dureeMs: this.depuisAffichage(),
    });
  }

  private noter(cle: string, valeur: string): void {
    this.redactions = { ...this.redactions, [cle]: valeur };
    this.signalerBrouillon(this.interne?.id ?? '', { redactions: this.redactions });
  }

  private aCompleter(): readonly WorkedEtape[] {
    return this.interne?.etapes.slice(this.montrees) ?? [];
  }

  private valider(): void {
    const exemple = this.interne;
    const ouvertes = this.aCompleter();
    if (
      exemple === null ||
      ouvertes.length === 0 ||
      this.verrouilleApresEnvoi(this.soumise, false)
    ) {
      return;
    }
    const manquante = ouvertes.some(
      (etape) => (this.redactions[etape.id] ?? '').trim().length === 0,
    );
    if (manquante) {
      this.message = this.texte('worked-etape-vide');
      this.refresh();
      return;
    }
    this.soumise = true;
    this.message = this.messageApresEnvoi();
    this.emit('fp-worked-submit', {
      exempleId: exemple.id,
      redactions: remplis(
        Object.fromEntries(ouvertes.map((etape) => [etape.id, this.redactions[etape.id] ?? ''])),
      ),
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
