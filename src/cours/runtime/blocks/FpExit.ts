import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';

export interface ExitOption extends OptionPublique {
  readonly misconception: string | null;
}

export interface ExitBilletPublic {
  readonly id: string;
  readonly question: string;
  readonly invite: string;
  readonly options: readonly OptionPublique[];
  readonly metadonnees: MetadonneesBrique;
}

export interface ExitBillet extends ExitBilletPublic {
  readonly options: readonly ExitOption[];
}

const LIMITE_TEXTE_LIBRE = 500;
const ID_TEXTE_LIBRE = 'fp-exit-texte-libre';

export class FpExit extends FpBlock {
  private interne: ExitBilletPublic | null = null;
  private texteLibre = '';
  private choix: string | null = null;
  private message = '';
  private repondu = false;

  set billet(valeur: ExitBilletPublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : this.projeter(valeur);
    if (change) {
      this.texteLibre = '';
      this.choix = null;
      this.message = '';
      this.repondu = false;
    }
    this.refreshSiConnecte();
  }

  get billet(): ExitBilletPublic | null {
    return this.interne;
  }

  renderHand(): EscapedHtml {
    const billet = this.billet;
    if (!billet) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <fieldset class="fp-carte fp-exit__billet">
        <legend>${escapeHtml(billet.question)}</legend>
        <div class="fp-exit__choix">${this.boutonsOption(billet.options)}</div>
        <label class="fp-exit__invite" for="${escapeHtml(ID_TEXTE_LIBRE)}">${escapeHtml(billet.invite)}</label>
        <textarea class="fp-exit__champ" id="${escapeHtml(ID_TEXTE_LIBRE)}" data-testid="texte-libre" rows="4">${escapeHtml(this.texteLibre)}</textarea>
        <p class="fp-exit__jauge" data-testid="jauge">${this.texteLibre.length} / ${LIMITE_TEXTE_LIBRE}</p>
        <button type="button" class="fp-exit__envoyer" data-testid="envoyer">${escapeHtml(this.texte('envoyer'))}</button>
        <p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.recapitulatif()}
      </fieldset>
    `;
  }

  renderStage(): EscapedHtml {
    const billet = this.billet;
    if (!billet) {
      return safeHtml``;
    }
    return safeHtml`<div class="fp-carte fp-scene"><p class="fp-enonce">${escapeHtml(billet.question)}</p><p class="fp-exit__invite" data-testid="invite">${escapeHtml(billet.invite)}</p></div>`;
  }

  renderBoard(): EscapedHtml {
    const billet = this.billet;
    if (!billet) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = billet.metadonnees;
    return safeHtml`
      <div class="fp-carte fp-exit__billet">
        <p class="fp-enonce">${escapeHtml(billet.question)}</p>
        <p class="fp-badge" data-testid="regime">${escapeHtml(metadonnees.regime)}</p>
        <p class="fp-badge" data-testid="duree">${metadonnees.dureeMinutes} min</p>
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.billet?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    const champ = racine.querySelector<HTMLTextAreaElement>('[data-testid="texte-libre"]');
    const envoyer = racine.querySelector<HTMLButtonElement>('[data-testid="envoyer"]');
    if (champ === null || envoyer === null) {
      return;
    }
    champ.disabled = this.repondu;
    envoyer.disabled = this.repondu;
    champ.addEventListener('input', () => {
      this.texteLibre = champ.value;
    });
    envoyer.addEventListener('click', () => this.envoyer(champ.value));
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.disabled = this.repondu;
      bouton.addEventListener('click', () => this.selectionner(bouton.dataset['option'] ?? ''));
    }
  }

  private projeter(source: ExitBilletPublic): ExitBilletPublic {
    return {
      id: source.id,
      question: source.question,
      invite: source.invite,
      options:
        this.roleActuel() === 'presentateur' ? source.options : projeterOptions(source.options),
      metadonnees: projeterMetadonnees(source.metadonnees),
    };
  }

  private boutonsOption(options: readonly OptionPublique[]): readonly EscapedHtml[] {
    return options.map(
      (option) =>
        safeHtml`<button type="button" class="fp-exit__option" data-testid="option" data-option="${escapeHtml(option.id)}" aria-pressed="${escapeHtml(String(option.id === this.choix))}">${escapeHtml(option.libelle)}</button>`,
    );
  }

  private recapitulatif(): EscapedHtml {
    if (!this.repondu) {
      return escapeHtml('');
    }
    return safeHtml`<div class="fp-exit__recap" data-testid="recap"><p class="fp-exit__recap-choix" data-testid="recap-choix">${escapeHtml(this.libelleChoisi())}</p><p class="fp-exit__recap-texte" data-testid="recap-texte">${escapeHtml(this.texteLibre)}</p></div>`;
  }

  private libelleChoisi(): string {
    return this.billet?.options.find((option) => option.id === this.choix)?.libelle ?? '';
  }

  private messageTropLong(): string {
    return `${this.texte('texte-libre-trop-long')} ${LIMITE_TEXTE_LIBRE} ${this.texte('caracteres-maximum')}`;
  }

  private selectionner(valeur: string): void {
    if (this.repondu) {
      return;
    }
    this.choix = valeur;
    this.message = '';
    this.refresh();
  }

  private envoyer(brut: string): void {
    if (this.repondu) {
      return;
    }
    this.texteLibre = brut;
    if (this.choix === null) {
      this.message = this.texte('choix-obligatoire');
      this.refresh();
      return;
    }
    if (brut.length > LIMITE_TEXTE_LIBRE) {
      this.message = this.messageTropLong();
      this.refresh();
      return;
    }
    this.repondu = true;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-exit-submit', {
      billetId: this.billet?.id,
      valeur: this.choix,
      texteLibre: brut,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
