import { PHASES_DE_VOTE } from 'portfolio-2025-partage/contrats';
import type { MetadonneesBrique, VotePhase } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { lignesDeCalculHtml } from './calculs';
import {
  avecJeNeSaisPas,
  ID_JE_NE_SAIS_PAS,
  type OptionPublique,
  projeterMetadonnees,
  projeterOptions,
} from './projection';
import { estObjet, part } from '../core/valeurs';
import {
  bonneReponseRevelee,
  lireBonneOption,
  lireBonneReponse,
  marqueDOption,
  VerdictsParQuestion,
} from './retours';
import { FpVerdicts } from './verdicts';

export interface VoteQuestionPublique {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
  readonly metadonnees?: MetadonneesBrique;
}

export interface VoteResultats {
  readonly total: number;
  readonly parOption: Readonly<Record<string, number>>;
}

interface Revelation {
  readonly titre: string;
  readonly lignes: readonly string[];
}

const VIDE = escapeHtml('');

const ANNONCE_DE_PHASE: Readonly<Partial<Record<VotePhase, string>>> = {
  discussion: 'discussion-en-cours',
  revele: 'vote-phase-revele',
};

function projeter(valeur: VoteQuestionPublique | null): VoteQuestionPublique | null {
  if (valeur === null) {
    return null;
  }
  const metadonnees = valeur.metadonnees;
  return {
    id: valeur.id,
    enonce: valeur.enonce,
    options: projeterOptions(valeur.options),
    ...(metadonnees === undefined ? {} : { metadonnees: projeterMetadonnees(metadonnees) }),
  };
}

function elementDeListe(ligne: string): EscapedHtml {
  return safeHtml`<li>${lignesDeCalculHtml(ligne)}</li>`;
}

function lireRevelation(valeur: unknown): Revelation | null {
  if (!estObjet(valeur) || valeur['type'] !== 'revelation') {
    return null;
  }
  const titre = valeur['titre'];
  const lignes = valeur['lignes'];
  return typeof titre === 'string' &&
    Array.isArray(lignes) &&
    lignes.every((ligne) => typeof ligne === 'string')
    ? { titre, lignes }
    : null;
}

function optionDeLaRevelation(valeur: unknown): string | null {
  if (lireRevelation(valeur) === null || !estObjet(valeur)) {
    return null;
  }
  const optionId = valeur['optionId'];
  return typeof optionId === 'string' ? optionId : null;
}

export class FpVote extends FpVerdicts {
  private principale: VoteQuestionPublique | null = null;
  private jumelle: VoteQuestionPublique | null = null;
  private internePhase: VotePhase | null = null;
  private interneResultats: VoteResultats | null = null;
  private premierVote: VoteResultats | null = null;
  private revelation: Revelation | null = null;
  private bonneReponse: string | null = null;
  private bonneOption: string | null = null;
  private choix = new Map<string, string>();

  set question(valeur: VoteQuestionPublique | null) {
    if ((valeur?.id ?? null) !== (this.principale?.id ?? null)) {
      this.recus = new VerdictsParQuestion();
      this.choix = new Map();
    }
    this.principale = projeter(valeur);
    this.refreshSiConnecte();
  }

  get question(): VoteQuestionPublique | null {
    return this.principale;
  }

  set questionJumelle(valeur: VoteQuestionPublique | null | undefined) {
    this.jumelle = projeter(valeur ?? null);
    this.refreshSiConnecte();
  }

  get questionJumelle(): VoteQuestionPublique | null {
    return this.jumelle;
  }

  set phase(valeur: VotePhase | null | undefined) {
    this.internePhase = PHASES_DE_VOTE.find((phase) => phase === valeur) ?? null;
    this.refreshSiConnecte();
  }

  get phase(): VotePhase | null {
    return this.internePhase;
  }

  set resultats(valeur: VoteResultats | null) {
    this.interneResultats = valeur;
    this.refreshSiConnecte();
  }

  get resultats(): VoteResultats | null {
    return this.interneResultats;
  }

  set resultatsPremierVote(valeur: VoteResultats | null) {
    this.premierVote = valeur;
    this.refreshSiConnecte();
  }

  get resultatsPremierVote(): VoteResultats | null {
    return this.premierVote;
  }

  protected verdictAttendu(questionId: string): boolean {
    return questionId === this.principale?.id || questionId === this.jumelle?.id;
  }

  set corrige(valeur: unknown) {
    this.revelation = lireRevelation(valeur);
    this.bonneReponse = lireBonneReponse(valeur);
    this.bonneOption = lireBonneOption(valeur) ?? optionDeLaRevelation(valeur);
    this.refreshSiConnecte();
  }

  get questionAffichee(): VoteQuestionPublique | null {
    const surLaJumelle = this.internePhase === 'revote' || this.internePhase === 'revele';
    return surLaJumelle && this.jumelle !== null ? this.jumelle : this.principale;
  }

  render(): EscapedHtml {
    const question = this.questionAffichee;
    if (!question) {
      return this.attente();
    }
    if (this.surPapier() && !this.presentateur()) {
      return this.questionsImprimees();
    }
    const proposees = this.presentateur() ? question.options : this.toutesLesOptions(question);
    return safeHtml`<div class="fp-carte fp-scene"${this.marqueDePhase()}>
      ${this.annoncePhase()}
      <fieldset class="fp-vote__options">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        <div class="fp-vote__corps">
          ${proposees.map((option) => this.bouton(question, option))}
        </div>
      </fieldset>
      ${this.presentateur() ? this.suiviProjete(question) : this.suiviEtudiant(question)}
      ${bonneReponseRevelee(this.texte('bonne-reponse'), this.bonneReponse)}${this.revelationRevelee()}
    </div>`;
  }

  private questionsImprimees(): EscapedHtml {
    const questions = [this.principale, this.jumelle].filter(
      (question): question is VoteQuestionPublique => question !== null,
    );
    return safeHtml`<div class="fp-carte fp-scene">${questions.map(
      (question) => safeHtml`<fieldset class="fp-vote__options">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        <ul class="fp-cases">${question.options.map((option) => safeHtml`<li>${escapeHtml(option.libelle)}</li>`)}</ul>
      </fieldset>`,
    )}</div>`;
  }

  private suiviEtudiant(question: VoteQuestionPublique): EscapedHtml {
    const retour = this.choix.has(question.id) ? this.messageApresEnvoi() : '';
    return safeHtml`<p aria-live="polite" data-testid="retour">${escapeHtml(retour)}</p>${this.verdictDeReponse(this.recus.de(question.id))}${this.annonces()}`;
  }

  private suiviProjete(question: VoteQuestionPublique): EscapedHtml {
    if (this.internePhase === 'discussion' && this.surDeuxTemps()) {
      return this.histogramme(question, this.interneResultats, 'premier');
    }
    if (this.internePhase !== 'revele' && !this.cloture) {
      return this.decompte();
    }
    const comparaison =
      question === this.jumelle && this.principale !== null && this.premierVote !== null
        ? safeHtml`${this.histogramme(this.principale, this.premierVote, 'premier')}${this.histogramme(question, this.interneResultats, 'second')}`
        : this.histogramme(question, this.interneResultats);
    return safeHtml`${comparaison}${this.decompte()}`;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.questionAffichee?.id ?? null);
    const ouverte = !this.presentateur() && this.ouverte();
    this.brancherLesBoutons(racine, '[data-option]', !ouverte, ({ dataset }) =>
      this.choisir(dataset['option'] ?? ''),
    );
  }

  private surDeuxTemps(): boolean {
    return this.jumelle !== null && this.internePhase !== null;
  }

  private ouverte(): boolean {
    const question = this.questionAffichee;
    if (question === null || this.internePhase === 'discussion') {
      return false;
    }
    if (this.enApercu()) {
      return true;
    }
    const repondue =
      (this.choix.has(question.id) && this.erreur === null) || this.recus.a(question.id);
    return !repondue && !this.dejaRepondu && !this.cloture;
  }

  private marqueDePhase(): EscapedHtml {
    if (!this.surDeuxTemps() || this.internePhase === null) {
      return VIDE;
    }
    return safeHtml` data-phase="${escapeHtml(this.internePhase)}"`;
  }

  private annoncePhase(): EscapedHtml {
    const annonce =
      this.surDeuxTemps() && this.internePhase !== null
        ? ANNONCE_DE_PHASE[this.internePhase]
        : undefined;
    if (annonce === undefined) {
      return VIDE;
    }
    return safeHtml`<p class="fp-vote__phase" role="status" data-testid="phase">${escapeHtml(this.texte(annonce))}</p>`;
  }

  private toutesLesOptions(question: VoteQuestionPublique): OptionPublique[] {
    return avecJeNeSaisPas(question.options, this.texte('je-ne-sais-pas'));
  }

  private bouton(question: VoteQuestionPublique, { id, libelle }: OptionPublique): EscapedHtml {
    const choisie = this.choix.get(question.id) === id;
    const neutre = id === ID_JE_NE_SAIS_PAS;
    const classes = neutre ? 'fp-vote__option fp-vote__option--neutre' : 'fp-vote__option';
    const marque = neutre ? 'je-ne-sais-pas' : 'option';
    return safeHtml`<button type="button" class="${escapeHtml(classes)}" data-testid="${escapeHtml(marque)}" data-option="${escapeHtml(id)}" aria-pressed="${escapeHtml(String(choisie))}"${marqueDOption(id, this.bonneOption, choisie)}>${escapeHtml(libelle)}</button>`;
  }

  private choisir(valeur: string): void {
    const question = this.questionAffichee;
    if (question === null || !this.ouverte()) {
      return;
    }
    this.choix.set(question.id, valeur);
    this.emit('fp-vote-submit', {
      questionId: question.id,
      valeur,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }

  private decompte(): EscapedHtml {
    if (this.interneResultats === null) {
      return VIDE;
    }
    return safeHtml`<p class="fp-vote__decompte" data-testid="decompte">${escapeHtml(this.texte('pulse-total'))} ${this.interneResultats.total}</p>`;
  }

  private revelationRevelee(): EscapedHtml {
    const revelation = this.revelation;
    if (revelation === null) {
      return VIDE;
    }
    return safeHtml`<div class="fp-encadre fp-vote__revelation" data-testid="revelation"><p class="fp-vote__titre">${escapeHtml(revelation.titre)}</p><ul>${revelation.lignes.map(elementDeListe)}</ul></div>`;
  }

  private barre({ id, libelle }: OptionPublique, pourcentage: number): EscapedHtml {
    return safeHtml`<div class="fp-vote__barre" data-testid="barre" data-option="${escapeHtml(id)}"><span class="fp-vote__barre__libelle" data-testid="barre-libelle">${escapeHtml(libelle)}</span><span class="fp-vote__barre__piste"><span class="fp-vote__barre__valeur" data-testid="barre-valeur" style="width:${pourcentage}%"></span></span><span class="fp-vote__barre__pourcentage">${pourcentage}%</span></div>`;
  }

  private histogramme(
    question: VoteQuestionPublique,
    resultats: VoteResultats | null,
    vote?: 'premier' | 'second',
  ): EscapedHtml {
    const marqueDuVote = vote === undefined ? VIDE : safeHtml` data-vote="${escapeHtml(vote)}"`;
    if (!resultats || resultats.total === 0) {
      return safeHtml`<div class="fp-vote__histogramme" data-testid="histogramme"${marqueDuVote}></div>`;
    }
    const barres = this.toutesLesOptions(question).map((option) =>
      this.barre(
        option,
        Math.round(part(resultats.parOption[option.id] ?? 0, resultats.total) * 100),
      ),
    );
    return safeHtml`<div class="fp-vote__histogramme" data-testid="histogramme"${marqueDuVote}>${barres}</div>`;
  }
}
