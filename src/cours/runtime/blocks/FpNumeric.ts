import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';

export type Tolerance =
  | { readonly type: 'absolue'; readonly valeur: number }
  | { readonly type: 'relative'; readonly valeur: number }
  | { readonly type: 'decimales'; readonly valeur: number };

export interface NumericQuestionPublique {
  readonly id: string;
  readonly enonce: string;
  readonly unite: string | null;
  readonly metadonnees: MetadonneesBrique;
}

export interface NumericQuestion extends NumericQuestionPublique {
  readonly tolerance: Tolerance;
  readonly valeurAttendue: number;
}

const ID_UNITE = 'fp-numeric-unite';
const ESPACES = /\s/g;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function normaliserSaisie(brut: string): number | null {
  const compacte = brut.replace(ESPACES, '').replaceAll(',', '.');
  return DECIMAL.test(compacte) ? Number(compacte) : null;
}

function projeterMetadonnees(source: MetadonneesBrique): MetadonneesBrique {
  return {
    concepts: [...source.concepts],
    misconceptionsCiblees: [...source.misconceptionsCiblees],
    dureeMinutes: source.dureeMinutes,
    modalite: source.modalite,
    regime: source.regime,
  };
}

function projeterQuestion(source: NumericQuestionPublique): NumericQuestionPublique {
  return {
    id: source.id,
    enonce: source.enonce,
    unite: source.unite,
    metadonnees: projeterMetadonnees(source.metadonnees),
  };
}

export class FpNumeric extends FpBlock {
  private interne: NumericQuestionPublique | null = null;
  private saisie = '';
  private message = '';
  private affiche = 0;
  private questionAffichee: string | null = null;
  private repondu = false;

  set question(valeur: NumericQuestionPublique | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : projeterQuestion(valeur);
    if (change) {
      this.saisie = '';
      this.message = '';
      this.repondu = false;
    }
    this.refreshSiConnecte();
  }

  get question(): NumericQuestionPublique | null {
    return this.interne;
  }

  renderHand(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const unite = question.unite;
    const etiquette =
      unite === null
        ? escapeHtml('')
        : safeHtml`<span class="fp-numeric__unite" id="${escapeHtml(ID_UNITE)}" data-testid="unite">${escapeHtml(unite)}</span>`;
    const decrit =
      unite === null ? escapeHtml('') : safeHtml`aria-describedby="${escapeHtml(ID_UNITE)}"`;
    return safeHtml`
      <fieldset class="fp-carte fp-numeric__numerique">
        <legend>${escapeHtml(question.enonce)}</legend>
        <div class="fp-numeric__saisie">
          <input class="fp-numeric__champ" data-testid="champ" type="text" inputmode="decimal" autocomplete="off" value="${escapeHtml(this.saisie)}" ${decrit}>
          ${etiquette}
        </div>
        <button type="button" class="fp-numeric__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        <p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
      </fieldset>
    `;
  }

  renderStage(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml``;
    }
    const unite = question.unite;
    const rappel =
      unite === null
        ? escapeHtml('')
        : safeHtml`<p class="fp-numeric__unite" data-testid="unite">${escapeHtml(unite)}</p>`;
    return safeHtml`<div class="fp-carte fp-scene"><p class="fp-enonce">${escapeHtml(question.enonce)}</p>${rappel}</div>`;
  }

  renderBoard(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = question.metadonnees;
    return safeHtml`
      <div class="fp-carte fp-numeric__numerique">
        <p class="fp-enonce">${escapeHtml(question.enonce)}</p>
        <p class="fp-badge" data-testid="modalite">${escapeHtml(metadonnees.modalite)}</p>
        <p class="fp-badge" data-testid="duree">${metadonnees.dureeMinutes} min</p>
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    const presentee = this.question?.id ?? null;
    if (presentee !== this.questionAffichee) {
      this.questionAffichee = presentee;
      this.affiche = Date.now();
    }
    if (this.mode() !== 'hand') {
      return;
    }
    const champ = racine.querySelector<HTMLInputElement>('[data-testid="champ"]');
    const valider = racine.querySelector<HTMLButtonElement>('[data-testid="valider"]');
    if (champ === null || valider === null) {
      return;
    }
    champ.disabled = this.repondu;
    valider.disabled = this.repondu;
    champ.addEventListener('input', () => {
      this.saisie = champ.value;
    });
    valider.addEventListener('click', () => this.soumettre(champ.value));
  }

  private soumettre(brut: string): void {
    if (this.repondu) {
      return;
    }
    this.saisie = brut;
    const valeur = normaliserSaisie(brut);
    if (valeur === null) {
      this.message = this.texte('saisie-non-numerique');
      this.refresh();
      return;
    }
    this.repondu = true;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-numeric-submit', {
      questionId: this.question?.id,
      valeur,
      dureeMs: Date.now() - this.affiche,
    });
    this.refresh();
  }
}
