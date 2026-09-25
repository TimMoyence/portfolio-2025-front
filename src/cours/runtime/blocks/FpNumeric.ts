import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpReponse } from './reponse';
import { type ContenuDeBrique, copierLeSocle } from './projection';
import { lireBonneReponse } from './retours';
import { lireNombreSaisi } from './saisie-numerique';

export interface NumericQuestionPublique extends ContenuDeBrique {
  readonly enonce: string;
  readonly unite: string | null;
}

const ID_UNITE = 'fp-numeric-unite';

function projeterQuestion(source: NumericQuestionPublique): NumericQuestionPublique {
  return {
    ...copierLeSocle(source),
    enonce: source.enonce,
    unite: source.unite,
  };
}

export class FpNumeric extends FpReponse<NumericQuestionPublique> {
  private saisie = '';

  set question(valeur: NumericQuestionPublique | null) {
    this.poserLeContenu(valeur, projeterQuestion);
    this.refreshSiConnecte();
  }

  get question(): NumericQuestionPublique | null {
    return this.interne;
  }

  set corrige(valeur: unknown) {
    this.bonneReponse = lireBonneReponse(valeur);
    this.refreshSiConnecte();
  }

  protected rendreLaQuestion(question: NumericQuestionPublique): EscapedHtml {
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
        ${this.suiviDeLEnvoi()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-numeric__numerique">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        ${saisie}
        ${this.bonneReponseRevelee((bonne) => bonne.replace('.', ','))}
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

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.question?.id ?? null);
    this.brancherLaSaisie(
      racine,
      { champ: 'champ', bouton: 'valider', verrouille: this.verrouille() },
      {
        saisir: (saisie) => {
          this.saisie = saisie;
        },
        envoyer: (saisie) => this.soumettre(saisie),
      },
    );
  }

  protected effacerLaSaisie(): void {
    this.saisie = '';
  }

  protected reprendreLeBrouillon(): boolean {
    return false;
  }

  private soumettre(brut: string): void {
    if (this.verrouille()) {
      return;
    }
    this.saisie = brut;
    const valeur = lireNombreSaisi(brut);
    if (valeur === null) {
      this.refuserLEnvoi(this.texte('saisie-non-numerique'));
      return;
    }
    this.conclureLEnvoi('fp-numeric-submit', { questionId: this.question?.id, valeur });
  }
}
