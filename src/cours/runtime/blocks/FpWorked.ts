import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { type ContenuDeBrique, copierLeSocle } from './projection';
import { FpRedaction } from './redaction';

export interface WorkedEtape {
  readonly id: string;
  readonly intitule: string;
  readonly raisonnement: string;
  readonly invite: string;
}

export interface WorkedExemple extends ContenuDeBrique {
  readonly enonce: string;
  readonly etapes: readonly WorkedEtape[];
}

function copierEtape(etape: WorkedEtape): WorkedEtape {
  return {
    id: etape.id,
    intitule: etape.intitule,
    raisonnement: etape.raisonnement,
    invite: etape.invite,
  };
}

function copierExemple(source: WorkedExemple): WorkedExemple {
  return {
    ...copierLeSocle(source),
    enonce: source.enonce,
    etapes: source.etapes.map(copierEtape),
  };
}

export class FpWorked extends FpRedaction<WorkedExemple> {
  protected readonly cleDuBrouillon = 'redactions';
  private montrees = 0;
  private estPilote = false;

  set exemple(valeur: WorkedExemple | null) {
    this.poserLeContenu(valeur, copierExemple);
    this.refreshSiConnecte();
  }

  get exemple(): WorkedExemple | null {
    const source = this.interne;
    if (source === null) {
      return null;
    }
    return {
      ...copierLeSocle(source),
      enonce: source.enonce,
      etapes: source.etapes.map((etape, rang) => this.projeterEtape(etape, rang)),
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

  set pilote(valeur: boolean | null | undefined) {
    this.estPilote = valeur === true;
    this.refreshSiConnecte();
  }

  render(): EscapedHtml {
    const exemple = this.exemple;
    if (exemple === null) {
      return this.attente();
    }
    if (this.estPilote || this.presentateur()) {
      return this.etapesPilotees(exemple);
    }
    return safeHtml`
      <section class="fp-carte fp-scene fp-worked__exemple">
        <p class="fp-enonce fp-worked__enonce" data-testid="enonce">${escapeHtml(exemple.enonce)}</p>
        <p class="fp-worked__consigne">${escapeHtml(this.texte('worked-consigne'))}</p>
        <ol class="fp-worked__etapes">${exemple.etapes.map((etape, rang) => this.etape(etape, rang))}</ol>
        <button type="button" class="fp-worked__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        <p class="fp-worked__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.annonces()}
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    if (!this.suivreEtSaisir(this.interne?.id ?? null) || this.estPilote) {
      return;
    }
    const verrouille = this.verrouille();
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

  private etapesPilotees(exemple: WorkedExemple): EscapedHtml {
    return safeHtml`
      <section class="fp-carte fp-scene fp-worked__exemple" data-pilote="${escapeHtml(String(this.estPilote))}">
        <p class="fp-enonce fp-worked__enonce" data-testid="enonce">${escapeHtml(exemple.enonce)}</p>
        <ol class="fp-worked__etapes">${exemple.etapes.map((etape, rang) => this.etapeProjetee(etape, rang))}</ol>
      </section>
    `;
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
    if (rang < this.montrees) {
      return copierEtape(etape);
    }
    return { ...copierEtape(etape), raisonnement: '' };
  }

  private carteDEtape(
    etape: WorkedEtape,
    rang: number,
    corps: (resolue: boolean) => EscapedHtml,
  ): EscapedHtml {
    const resolue = rang < this.montrees;
    return safeHtml`
      <li class="fp-worked__etape" data-testid="etape" data-etape="${escapeHtml(etape.id)}" data-resolue="${escapeHtml(String(resolue))}">
        <p class="fp-worked__intitule">${escapeHtml(etape.intitule)}</p>
        ${corps(resolue)}
      </li>
    `;
  }

  private etape(etape: WorkedEtape, rang: number): EscapedHtml {
    return this.carteDEtape(
      etape,
      rang,
      (resolue) => safeHtml`
        ${resolue ? this.saisieFigee(etape) : this.redaction(etape)}
        ${resolue && etape.raisonnement !== '' ? this.correction(etape) : safeHtml``}
      `,
    );
  }

  private correction(etape: WorkedEtape): EscapedHtml {
    return safeHtml`
      <p class="fp-worked__demande" data-testid="correction">${escapeHtml(this.texte('worked-correction'))}</p>
      ${this.raisonnement(etape)}
    `;
  }

  private etapeProjetee(etape: WorkedEtape, rang: number): EscapedHtml {
    return this.carteDEtape(
      etape,
      rang,
      (resolue) => safeHtml`
        <p class="fp-worked__invite" data-testid="question">${escapeHtml(etape.invite)}</p>
        ${resolue ? this.correction(etape) : safeHtml``}
      `,
    );
  }

  private raisonnement(etape: WorkedEtape): EscapedHtml {
    return safeHtml`<p class="fp-worked__raisonnement" data-testid="raisonnement" data-etape="${escapeHtml(etape.id)}">${escapeHtml(etape.raisonnement)}</p>`;
  }

  private redaction(etape: WorkedEtape): EscapedHtml {
    const identifiant = `fp-worked-saisie-${etape.id}`;
    return safeHtml`
      <label class="fp-worked__invite" for="${escapeHtml(identifiant)}">${escapeHtml(etape.invite)}</label>
      <textarea class="fp-worked__champ" id="${escapeHtml(identifiant)}" data-testid="saisie" data-etape="${escapeHtml(etape.id)}" rows="3">${escapeHtml(this.texteDe(etape.id))}</textarea>
    `;
  }

  private saisieFigee(etape: WorkedEtape): EscapedHtml {
    return safeHtml`
      <p class="fp-worked__invite">${escapeHtml(etape.invite)}</p>
      <p class="fp-worked__reponse" data-testid="saisie-figee" data-etape="${escapeHtml(etape.id)}">${escapeHtml(this.texteDe(etape.id))}</p>
    `;
  }

  private envoyerEtape(cle: string): void {
    const exemple = this.interne;
    const texte = this.texteDe(cle).trim();
    if (exemple === null || texte.length === 0 || this.verrouille()) {
      return;
    }
    this.emit('fp-worked-submit', {
      exempleId: exemple.id,
      redactions: { [cle]: texte },
      dureeMs: this.depuisAffichage(),
    });
  }

  private aCompleter(): readonly WorkedEtape[] {
    return this.interne?.etapes.slice(this.montrees) ?? [];
  }

  private valider(): void {
    const exemple = this.interne;
    const ouvertes = this.aCompleter();
    if (exemple === null || ouvertes.length === 0 || this.verrouille()) {
      return;
    }
    const cles = ouvertes.map((etape) => etape.id);
    if (this.manqueUnTexte(cles)) {
      this.refuserLEnvoi(this.texte('worked-etape-vide'));
      return;
    }
    this.conclureLEnvoi('fp-worked-submit', {
      exempleId: exemple.id,
      redactions: this.textesDe(cles),
    });
  }

  protected override effacerLaSaisie(): void {
    super.effacerLaSaisie();
    this.montrees = 0;
  }
}
