import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import { estVerdictDeReponse, lireBonneReponse, type VerdictDeReponse } from './retours';
import { lireNombreSaisi } from './saisie-numerique';

export interface NumericQuestionPublique {
  readonly id: string;
  readonly enonce: string;
  readonly unite: string | null;
  readonly metadonnees: MetadonneesBrique;
}

const ID_UNITE = 'fp-numeric-unite';

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
  private interneVerdict: VerdictDeReponse | null = null;
  private bonneReponse: string | null = null;
  private saisie = '';
  private message = '';
  private envoye = false;

  set question(valeur: NumericQuestionPublique | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : projeterQuestion(valeur);
    if (change) {
      this.saisie = '';
      this.message = '';
      this.envoye = false;
      this.interneVerdict = null;
    }
    this.refreshSiConnecte();
  }

  get question(): NumericQuestionPublique | null {
    return this.interne;
  }

  set verdict(valeur: VerdictDeReponse | null) {
    this.interneVerdict =
      estVerdictDeReponse(valeur) && valeur.questionId === this.interne?.id ? valeur : null;
    this.refreshSiConnecte();
  }

  get verdict(): VerdictDeReponse | null {
    return this.interneVerdict;
  }

  set corrige(valeur: unknown) {
    this.bonneReponse = lireBonneReponse(valeur);
    this.refreshSiConnecte();
  }

  render(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const unite = question.unite;
    const etiquette =
      unite === null
        ? escapeHtml('')
        : safeHtml`<span class="fp-numeric__unite" id="${escapeHtml(ID_UNITE)}" data-testid="unite">${escapeHtml(unite)}</span>`;
    const decrit =
      unite === null ? escapeHtml('') : safeHtml`aria-describedby="${escapeHtml(ID_UNITE)}"`;
    const saisie = this.presentateur()
      ? escapeHtml('')
      : safeHtml`<div class="fp-numeric__saisie">
          <input class="fp-numeric__champ" data-testid="champ" type="text" inputmode="decimal" autocomplete="off" value="${escapeHtml(this.saisie)}"${this.marqueDeSaisie()} ${decrit}>
          ${etiquette}
        </div>
        <button type="button" class="fp-numeric__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        <p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.verdictDeReponse(this.interneVerdict)}
        ${this.annonces()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-numeric__numerique">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        ${saisie}
        ${this.bonneReponseRevelee()}
      </fieldset>
    `;
  }

  private marqueDeSaisie(): EscapedHtml {
    if (this.bonneReponse === null || this.interneVerdict === null) {
      return escapeHtml('');
    }
    return this.interneVerdict.correcte
      ? safeHtml` data-correction="juste"`
      : safeHtml` data-correction="fausse"`;
  }

  private bonneReponseRevelee(): EscapedHtml {
    if (this.bonneReponse === null) {
      return escapeHtml('');
    }
    return safeHtml`<p class="fp-encadre" data-etat="confirme" data-testid="bonne-reponse">${escapeHtml(this.texte('bonne-reponse'))} ${escapeHtml(this.bonneReponse.replace('.', ','))}</p>`;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.question?.id ?? null);
    const champ = racine.querySelector<HTMLInputElement>('[data-testid="champ"]');
    const valider = racine.querySelector<HTMLButtonElement>('[data-testid="valider"]');
    if (champ === null || valider === null) {
      return;
    }
    const verrouille = this.verrouille();
    champ.disabled = verrouille;
    valider.disabled = verrouille;
    champ.addEventListener('input', () => {
      this.saisie = champ.value;
    });
    valider.addEventListener('click', () => this.soumettre(champ.value));
  }

  private verrouille(): boolean {
    return this.verrouilleApresEnvoi(this.envoye, this.interneVerdict !== null);
  }

  private soumettre(brut: string): void {
    if (this.verrouille()) {
      return;
    }
    this.saisie = brut;
    const valeur = lireNombreSaisi(brut);
    if (valeur === null) {
      this.message = this.texte('saisie-non-numerique');
      this.refresh();
      return;
    }
    this.envoye = true;
    this.message = this.messageApresEnvoi();
    this.emit('fp-numeric-submit', {
      questionId: this.question?.id,
      valeur,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
