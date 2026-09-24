import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';
import {
  type ConceptMaitrise,
  estObjet,
  estVerdictDeReponse,
  type VerdictDeReponse,
} from './retours';

export interface SpacedRappel {
  readonly id: string;
  readonly intitule: string;
  readonly metadonnees: MetadonneesBrique;
}

export interface SpacedQuestionPublique {
  readonly questionId: string;
  readonly concept: string;
  readonly boite: 1 | 2 | 3;
  readonly cours: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

const VIDE = escapeHtml('');
const BOITES = [1, 2, 3] as const;

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

interface BonneReponse {
  readonly cible: string;
  readonly optionId: string | null;
}

function lireBonnesReponses(valeur: unknown): ReadonlyMap<string, BonneReponse> | null {
  if (!estObjet(valeur) || valeur['type'] !== 'reponses' || !estObjet(valeur['reponses'])) {
    return null;
  }
  return new Map(
    Object.entries(valeur['reponses']).flatMap(([questionId, bonne]) =>
      estObjet(bonne) && typeof bonne['cible'] === 'string'
        ? [
            [
              questionId,
              {
                cible: bonne['cible'],
                optionId: typeof bonne['optionId'] === 'string' ? bonne['optionId'] : null,
              },
            ] as const,
          ]
        : [],
    ),
  );
}

function estConceptMaitrise(valeur: unknown): valeur is ConceptMaitrise {
  return (
    estObjet(valeur) &&
    typeof valeur['concept'] === 'string' &&
    typeof valeur['libelle'] === 'string' &&
    ['boite1', 'boite2', 'boite3', 'nonVus'].every((cle) => typeof valeur[cle] === 'number')
  );
}

export class FpSpaced extends FpBlock {
  private interneRappel: SpacedRappel | null = null;
  private interne: readonly SpacedQuestionPublique[] | null = null;
  private recus = new Map<string, VerdictDeReponse>();
  private repondues = new Set<string>();
  private carte: readonly ConceptMaitrise[] = [];
  private bonnes: ReadonlyMap<string, BonneReponse> | null = null;
  private message = '';

  set rappel(valeur: SpacedRappel | null) {
    this.interneRappel =
      valeur === null
        ? null
        : {
            id: valeur.id,
            intitule: valeur.intitule,
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    this.refreshSiConnecte();
  }

  get rappel(): SpacedRappel | null {
    return this.interneRappel;
  }

  set questions(valeur: readonly SpacedQuestionPublique[] | null) {
    this.interne = valeur === null ? null : valeur.map(projeterQuestion);
    this.message = '';
    this.suivreAffichage(this.cleAffichage());
    this.refreshSiConnecte();
  }

  get questions(): readonly SpacedQuestionPublique[] | null {
    return this.interne;
  }

  set verdicts(valeur: readonly VerdictDeReponse[] | null) {
    this.recus = new Map(
      (valeur ?? []).filter(estVerdictDeReponse).map((verdict) => [verdict.questionId, verdict]),
    );
    this.suivreAffichage(this.cleAffichage());
    this.refreshSiConnecte();
  }

  get verdicts(): readonly VerdictDeReponse[] {
    return [...this.recus.values()];
  }

  set maitrise(valeur: readonly ConceptMaitrise[] | null) {
    this.carte = (valeur ?? []).filter(estConceptMaitrise);
    this.refreshSiConnecte();
  }

  get maitrise(): readonly ConceptMaitrise[] {
    return this.carte;
  }

  set corrige(valeur: unknown) {
    this.bonnes = lireBonnesReponses(valeur);
    this.refreshSiConnecte();
  }

  render(): EscapedHtml {
    const corps = this.presentateur()
      ? this.carteDeMaitrise()
      : safeHtml`${this.annonces()}
        ${this.pupitreAvantRevelation()}
        ${this.bilan()}
        <p class="fp-spaced__annonce" role="status" aria-live="polite" data-testid="annonce">${escapeHtml(this.message)}</p>`;
    return safeHtml`
      <section class="fp-carte fp-scene fp-spaced__seance">
        ${this.entete()}
        <p class="fp-spaced__consigne">${escapeHtml(this.texte('spaced-consigne'))}</p>
        ${corps}
      </section>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.cleAffichage());
    if (this.presentateur()) {
      return;
    }
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.addEventListener('click', () => this.repondre(bouton.dataset['option'] ?? ''));
    }
  }

  private entete(): EscapedHtml {
    const rappel = this.interneRappel;
    return rappel === null
      ? VIDE
      : safeHtml`<p class="fp-spaced__intitule" data-testid="intitule">${escapeHtml(rappel.intitule)}</p>`;
  }

  private dejaTraitee(question: SpacedQuestionPublique): boolean {
    return this.repondues.has(question.questionId) || this.recus.has(question.questionId);
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
    return this.bonnes === null ? this.pupitre() : VIDE;
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
      return safeHtml`<p class="fp-spaced__termine" data-testid="termine">${escapeHtml(this.texte('spaced-termine'))}</p>`;
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
    const options = [
      ...question.options,
      { id: '__je_ne_sais_pas__', libelle: this.texte('je-ne-sais-pas') },
    ];
    const boutons = options.map(
      (option) =>
        safeHtml`<button type="button" class="fp-spaced__option" data-testid="option" data-option="${escapeHtml(option.id)}">${escapeHtml(option.libelle)}</button>`,
    );
    return safeHtml`<div class="fp-spaced__options" data-testid="options">${boutons}</div>`;
  }

  private bilan(): EscapedHtml {
    const lignes = (this.interne ?? [])
      .filter((question) => this.bonnes !== null || this.recus.has(question.questionId))
      .map((question) => {
        const verdict = this.recus.get(question.questionId) ?? null;
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
    return safeHtml`<span class="fp-spaced__bonne" data-testid="bonne-reponse">${escapeHtml(this.texte('bonne-reponse'))} ${escapeHtml(libelle)}</span>`;
  }

  private carteDeMaitrise(): EscapedHtml {
    if (this.carte.length === 0) {
      return VIDE;
    }
    const entetes = BOITES.map(
      (boite) => safeHtml`<th scope="col">${escapeHtml(this.texte('spaced-boite'))} ${boite}</th>`,
    );
    const lignes = this.carte.map(
      (concept) =>
        safeHtml`<tr class="fp-spaced__concept" data-testid="concept" data-concept="${escapeHtml(concept.concept)}"><th scope="row">${escapeHtml(concept.libelle)}</th><td class="fp-montant">${concept.boite1}</td><td class="fp-montant">${concept.boite2}</td><td class="fp-montant">${concept.boite3}</td><td class="fp-montant">${concept.nonVus}</td></tr>`,
    );
    return safeHtml`
      <table class="fp-spaced__maitrise" data-testid="carte-maitrise">
        <caption class="fp-spaced__mention">${escapeHtml(this.texte('spaced-carte-maitrise'))}</caption>
        <thead><tr><th scope="col"></th>${entetes}<th scope="col">${escapeHtml(this.texte('spaced-non-vus'))}</th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>
    `;
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
    this.message =
      this.questionCourante() === null ? this.texte('spaced-termine') : this.messageApresEnvoi();
    this.suivreAffichage(this.cleAffichage());
    this.refresh();
  }
}
