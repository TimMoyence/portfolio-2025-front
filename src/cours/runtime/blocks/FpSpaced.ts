import type { SpacedQuestionPubliqueResponseDto } from '../../../../contrat/types.gen';
import { BOITES_DE_REVISION } from '../../content/types';
import { dansUnDefileur } from '../core/defileur';
import { type EscapedHtml, escapeHtml, safeHtml, VIDE } from '../core/html';
import {
  type ContenuDeBrique,
  avecJeNeSaisPas,
  copierLeSocle,
  projeterOptions,
} from './projection';
import { estObjet } from '../core/valeurs';
import {
  bonneReponseRevelee,
  type CibleRevelee,
  type SyntheseConcept,
  lireCibleRevelee,
} from './retours';
import { FpVerdicts } from './verdicts';

export interface SpacedRappel extends ContenuDeBrique {
  readonly intitule: string;
}

export type SpacedQuestionPublique = SpacedQuestionPubliqueResponseDto;

const BONNE_EN_LIGNE = safeHtml`class="fp-spaced__bonne"`;

function projeterQuestion(source: SpacedQuestionPublique): SpacedQuestionPublique {
  return {
    questionId: source.questionId,
    concept: source.concept,
    boite: source.boite,
    cours: source.cours,
    enonce: source.enonce,
    options: projeterOptions(source.options),
  };
}

function lireBonnesReponses(valeur: unknown): ReadonlyMap<string, CibleRevelee> | null {
  if (!estObjet(valeur) || valeur['type'] !== 'reponses' || !estObjet(valeur['reponses'])) {
    return null;
  }
  return new Map(
    Object.entries(valeur['reponses']).flatMap(([questionId, bonne]) => {
      const cible = lireCibleRevelee(bonne);
      return cible === null ? [] : [[questionId, cible] as const];
    }),
  );
}

function estSyntheseConcept(valeur: unknown): valeur is SyntheseConcept {
  return (
    estObjet(valeur) &&
    typeof valeur['concept'] === 'string' &&
    typeof valeur['libelle'] === 'string' &&
    ['boite1', 'boite2', 'boite3', 'nonVus'].every((cle) => typeof valeur[cle] === 'number')
  );
}

export class FpSpaced extends FpVerdicts {
  private interneRappel: SpacedRappel | null = null;
  private interne: readonly SpacedQuestionPublique[] | null = null;
  private repondues = new Set<string>();
  private carte: readonly SyntheseConcept[] = [];
  private bonnes: ReadonlyMap<string, CibleRevelee> | null = null;
  private message = '';

  set rappel(valeur: SpacedRappel | null) {
    this.interneRappel =
      valeur === null ? null : { ...copierLeSocle(valeur), intitule: valeur.intitule };
    this.refreshSiConnecte();
  }

  get rappel(): SpacedRappel | null {
    return this.interneRappel;
  }

  set questions(valeur: readonly SpacedQuestionPublique[] | null) {
    this.interne = valeur === null ? null : valeur.map(projeterQuestion);
    this.message = '';
    this.suivreEtRafraichir(this.cleAffichage());
  }

  get questions(): readonly SpacedQuestionPublique[] | null {
    return this.interne;
  }

  protected verdictAttendu(): boolean {
    return true;
  }

  protected override verdictsRecus(): void {
    this.suivreEtRafraichir(this.cleAffichage());
  }

  set maitrise(valeur: readonly SyntheseConcept[] | null) {
    this.carte = (valeur ?? []).filter(estSyntheseConcept);
    this.refreshSiConnecte();
  }

  get maitrise(): readonly SyntheseConcept[] {
    return this.carte;
  }

  set corrige(valeur: unknown) {
    this.bonnes = lireBonnesReponses(valeur);
    this.refreshSiConnecte();
  }

  render(): EscapedHtml {
    return safeHtml`
      <section class="fp-carte fp-scene fp-spaced__seance">
        ${this.entete()}
        <p class="fp-spaced__consigne">${escapeHtml(this.texte('spaced-consigne'))}</p>
        ${this.corps()}
      </section>
    `;
  }

  private corps(): EscapedHtml {
    if (this.presentateur()) {
      return this.carteDeMaitrise();
    }
    return this.surPapier()
      ? this.questionsImprimees()
      : safeHtml`${this.annonces()}
        ${this.pupitreAvantRevelation()}
        ${this.bilan()}
        <p class="fp-spaced__annonce" role="status" aria-live="polite" data-testid="annonce">${escapeHtml(this.message)}</p>`;
  }

  private questionsImprimees(): EscapedHtml {
    const questions = (this.interne ?? []).map(
      (question) => safeHtml`<li data-question="${escapeHtml(question.questionId)}">
        <p class="fp-spaced__enonce" data-testid="enonce">${escapeHtml(question.enonce)}</p>
        <ul class="fp-spaced__choix fp-cases">${this.casesAImprimer(
          [...question.options].sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr')),
        )}</ul>
      </li>`,
    );
    return safeHtml`<ol class="fp-spaced__imprimees">${questions}</ol>`;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.cleAffichage());
    this.brancherLesBoutons(racine, '[data-option]', false, ({ dataset }) =>
      this.repondre(dataset['option'] ?? ''),
    );
  }

  private entete(): EscapedHtml {
    const rappel = this.interneRappel;
    return rappel === null
      ? VIDE
      : safeHtml`<p class="fp-spaced__intitule" data-testid="intitule">${escapeHtml(rappel.intitule)}</p>`;
  }

  private dejaTraitee(question: SpacedQuestionPublique): boolean {
    return this.repondues.has(question.questionId) || this.recus.a(question.questionId);
  }

  private questionCourante(): SpacedQuestionPublique | null {
    return this.interne?.find((question) => !this.dejaTraitee(question)) ?? null;
  }

  private rang(): number {
    return (this.interne ?? []).filter((question) => this.dejaTraitee(question)).length;
  }

  private total(): number {
    return this.interne?.length ?? 0;
  }

  private cleAffichage(): string | null {
    return this.questionCourante()?.questionId ?? null;
  }

  private pupitreAvantRevelation(): EscapedHtml {
    return this.bonnes === null && !this.cloture ? this.pupitre() : VIDE;
  }

  private pupitre(): EscapedHtml {
    const question = this.questionCourante();
    if (question === null) {
      return this.etatSansQuestion();
    }
    return safeHtml`${this.projection(question)}${this.options(question)}`;
  }

  private projection(question: SpacedQuestionPublique): EscapedHtml {
    return safeHtml`
      ${this.progression()}
      ${this.reperesDeQuestion(question)}
      <p class="fp-enonce fp-spaced__enonce" data-testid="enonce">${escapeHtml(question.enonce)}</p>
    `;
  }

  private etatSansQuestion(): EscapedHtml {
    if (this.interne === null) {
      return safeHtml`<p class="fp-spaced__attente" data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    if (this.total() > 0) {
      return safeHtml`<p class="fp-spaced__termine" role="status" data-testid="termine">${escapeHtml(this.texte('spaced-termine'))}</p>`;
    }
    return safeHtml`<p class="fp-spaced__vide" data-testid="vide">${escapeHtml(this.texte('spaced-vide'))}</p>`;
  }

  private progression(): EscapedHtml {
    const rang = Math.min(this.rang() + 1, this.total());
    return safeHtml`<p class="fp-spaced__progression" data-testid="progression">${escapeHtml(this.texte('spaced-progression'))} ${rang} / ${this.total()}</p>`;
  }

  private reperesDeQuestion(question: SpacedQuestionPublique): EscapedHtml {
    return safeHtml`
      <p class="fp-spaced__reperes">
        <span class="fp-badge fp-spaced__origine" data-testid="origine"><span class="fp-spaced__mention">${escapeHtml(this.texte('spaced-origine'))}</span><span data-testid="origine-cours">${escapeHtml(question.cours)}</span></span>
      </p>
    `;
  }

  private options(question: SpacedQuestionPublique): EscapedHtml {
    const boutons = avecJeNeSaisPas(question.options).map(
      (option) =>
        safeHtml`<button type="button" class="fp-spaced__option" data-testid="option" data-option="${escapeHtml(option.id)}">${escapeHtml(option.libelle)}</button>`,
    );
    return safeHtml`<div class="fp-spaced__options" data-testid="options">${boutons}</div>`;
  }

  private bilan(): EscapedHtml {
    const lignes = (this.interne ?? [])
      .filter((question) => this.bonnes !== null || this.recus.a(question.questionId))
      .map((question) => {
        const verdict = this.recus.de(question.questionId);
        return safeHtml`<li class="fp-spaced__ligne" data-testid="ligne" data-question="${escapeHtml(question.questionId)}"><span class="fp-spaced__nom">${escapeHtml(question.enonce)}</span>${this.verdictDeReponse(verdict)}${this.bonneReponse(question)}</li>`;
      });
    return lignes.length === 0
      ? VIDE
      : safeHtml`<ul class="fp-spaced__liste" data-testid="bilan">${lignes}</ul>`;
  }

  private bonneReponse(question: SpacedQuestionPublique): EscapedHtml {
    const bonne = this.bonnes?.get(question.questionId);
    if (bonne === undefined) {
      return VIDE;
    }
    const libelle =
      question.options.find((option) => option.id === bonne.optionId)?.libelle ?? bonne.cible;
    return bonneReponseRevelee(this.texte('bonne-reponse'), libelle, BONNE_EN_LIGNE);
  }

  private carteDeMaitrise(): EscapedHtml {
    if (this.carte.length === 0) {
      return VIDE;
    }
    const entetes = BOITES_DE_REVISION.map(
      (boite) => safeHtml`<th scope="col">${escapeHtml(this.texte('spaced-boite'))} ${boite}</th>`,
    );
    const lignes = this.carte.map(
      (concept) =>
        safeHtml`<tr class="fp-spaced__concept" data-testid="concept" data-concept="${escapeHtml(concept.concept)}"><th scope="row">${escapeHtml(concept.libelle)}</th><td class="fp-montant">${concept.boite1}</td><td class="fp-montant">${concept.boite2}</td><td class="fp-montant">${concept.boite3}</td><td class="fp-montant">${concept.nonVus}</td></tr>`,
    );
    return dansUnDefileur(safeHtml`
      <table class="fp-spaced__maitrise" data-testid="carte-maitrise">
        <caption class="fp-spaced__mention">${escapeHtml(this.texte('spaced-carte-maitrise'))}</caption>
        <thead><tr><th scope="col"></th>${entetes}<th scope="col">${escapeHtml(this.texte('spaced-non-vus'))}</th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>
    `);
  }

  private repondre(optionId: string): void {
    const question = this.questionCourante();
    if (question === null) {
      return;
    }
    this.repondues.add(question.questionId);
    this.emit('fp-spaced-reponse', {
      questionId: question.questionId,
      optionId,
      dureeMs: this.depuisAffichage(),
    });
    this.message = this.questionCourante() === null ? '' : this.messageApresEnvoi();
    this.suivreAffichage(this.cleAffichage());
    this.refresh();
  }
}
