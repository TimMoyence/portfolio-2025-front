import { PHASES_DE_VOTE, type MetadonneesBrique, type VotePhase } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml, VIDE } from '../core/html';
import { formaterPart } from '../core/typographie';
import {
  avecJeNeSaisPas,
  ID_JE_NE_SAIS_PAS,
  type OptionPublique,
  projeterMetadonnees,
  projeterOptions,
} from './projection';
import { estMembre, estObjet, memeIdentifiant, part } from '../core/valeurs';
import {
  bonneReponseRevelee,
  bonneReponseSansOptionMarquee,
  type CibleRevelee,
  lireCibleRevelee,
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

function lireCorrections(valeur: unknown): ReadonlyMap<string, CibleRevelee> {
  const reponses = estObjet(valeur) && valeur['type'] === 'reponses' ? valeur['reponses'] : null;
  if (!estObjet(reponses)) {
    return new Map();
  }
  return new Map(
    Object.entries(reponses).flatMap(([questionId, reponse]) => {
      const cible = lireCibleRevelee(reponse);
      return cible === null ? [] : [[questionId, cible] as const];
    }),
  );
}

export class FpVote extends FpVerdicts {
  private principale: VoteQuestionPublique | null = null;
  private jumelle: VoteQuestionPublique | null = null;
  private internePhase: VotePhase | null = null;
  private questionServie: string | null = null;
  private resultatsPrincipale: VoteResultats | null = null;
  private resultatsDeLaJumelle: VoteResultats | null = null;
  private corrections: ReadonlyMap<string, CibleRevelee> = new Map();
  private choix = new Map<string, string>();

  set question(valeur: VoteQuestionPublique | null) {
    if (!memeIdentifiant(valeur, this.principale)) {
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
    this.internePhase = estMembre(PHASES_DE_VOTE, valeur) ? valeur : null;
    this.refreshSiConnecte();
  }

  get phase(): VotePhase | null {
    return this.internePhase;
  }

  set resultats(valeur: VoteResultats | null) {
    this.resultatsPrincipale = valeur;
    this.refreshSiConnecte();
  }

  get resultats(): VoteResultats | null {
    return this.resultatsPrincipale;
  }

  set resultatsJumelle(valeur: VoteResultats | null) {
    this.resultatsDeLaJumelle = valeur;
    this.refreshSiConnecte();
  }

  get resultatsJumelle(): VoteResultats | null {
    return this.resultatsDeLaJumelle;
  }

  protected verdictAttendu(questionId: string): boolean {
    return questionId === this.principale?.id || questionId === this.jumelle?.id;
  }

  set corrige(valeur: unknown) {
    this.corrections = lireCorrections(valeur);
    this.refreshSiConnecte();
  }

  set questionAffichee(valeur: string | null | undefined) {
    this.questionServie = typeof valeur === 'string' ? valeur : null;
    this.refreshSiConnecte();
  }

  get questionAffichee(): string | null {
    return this.questionServie;
  }

  private affichee(): VoteQuestionPublique | null {
    return this.jumelle !== null && this.questionServie === this.jumelle.id
      ? this.jumelle
      : this.principale;
  }

  private lesDeux(): VoteQuestionPublique[] {
    return [this.principale, this.jumelle].filter(
      (question): question is VoteQuestionPublique => question !== null,
    );
  }

  private revelee(): boolean {
    return this.lesDeux().some((question) => this.corrections.has(question.id));
  }

  render(): EscapedHtml {
    const question = this.affichee();
    if (!question) {
      return this.attente();
    }
    if (this.surPapier() && !this.presentateur()) {
      return this.questionsImprimees();
    }
    const questions = this.revelee() ? this.lesDeux() : [question];
    return safeHtml`<div class="fp-carte fp-scene"${this.marqueDePhase()}>
      ${questions.map((affichee) => this.carteDeQuestion(affichee))}
      ${this.presentateur() ? VIDE : this.annonces()}
    </div>`;
  }

  private carteDeQuestion(question: VoteQuestionPublique): EscapedHtml {
    const proposees = this.presentateur() ? question.options : this.toutesLesOptions(question);
    const correction = this.corrections.get(question.id) ?? null;
    const bonneOption = correction?.optionId ?? null;
    return safeHtml`<fieldset class="fp-vote__options">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        <div class="fp-vote__corps">
          ${proposees.map((option) => this.bouton(question, option, bonneOption))}
        </div>
      </fieldset>
      ${this.presentateur() ? this.suiviProjete(question) : this.suiviEtudiant(question)}
      ${bonneReponseRevelee(this.texte('bonne-reponse'), bonneReponseSansOptionMarquee(correction?.cible ?? null, bonneOption, proposees))}`;
  }

  private questionsImprimees(): EscapedHtml {
    return safeHtml`<div class="fp-carte fp-scene">${this.lesDeux().map(
      (question) => safeHtml`<fieldset class="fp-vote__options">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        <ul class="fp-cases">${this.casesAImprimer(question.options)}</ul>
      </fieldset>`,
    )}</div>`;
  }

  private suiviEtudiant(question: VoteQuestionPublique): EscapedHtml {
    const retour = this.choix.has(question.id) ? this.messageApresEnvoi() : '';
    return safeHtml`<p aria-live="polite" data-testid="retour">${escapeHtml(retour)}</p>${this.verdictDeReponse(this.recus.de(question.id))}`;
  }

  private resultatsDe(question: VoteQuestionPublique): VoteResultats | null {
    return question === this.jumelle ? this.resultatsDeLaJumelle : this.resultatsPrincipale;
  }

  private suiviProjete(question: VoteQuestionPublique): EscapedHtml {
    const resultats = this.resultatsDe(question);
    if (!this.revelee() && !this.cloture) {
      return this.decompte(resultats);
    }
    return safeHtml`${this.histogramme(question, resultats)}${this.decompte(resultats)}`;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.affichee()?.id ?? null);
    const ouverte = !this.presentateur() && this.ouverte();
    this.brancherLesBoutons(racine, '[data-option]', !ouverte, ({ dataset }) =>
      this.choisir(dataset['option'] ?? ''),
    );
  }

  private ouverte(): boolean {
    const question = this.affichee();
    if (question === null || this.revelee()) {
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
    if (this.jumelle === null || this.internePhase === null) {
      return VIDE;
    }
    return safeHtml` data-phase="${escapeHtml(this.internePhase)}"`;
  }

  private toutesLesOptions(question: VoteQuestionPublique): OptionPublique[] {
    return avecJeNeSaisPas(question.options);
  }

  private bouton(
    question: VoteQuestionPublique,
    { id, libelle }: OptionPublique,
    bonneOption: string | null,
  ): EscapedHtml {
    const choisie = this.choix.get(question.id) === id;
    const neutre = id === ID_JE_NE_SAIS_PAS;
    const classes = neutre ? 'fp-vote__option fp-vote__option--neutre' : 'fp-vote__option';
    const marque = neutre ? 'je-ne-sais-pas' : 'option';
    return safeHtml`<button type="button" class="${escapeHtml(classes)}" data-testid="${escapeHtml(marque)}" data-option="${escapeHtml(id)}" aria-pressed="${escapeHtml(String(choisie))}"${marqueDOption(id, bonneOption, choisie)}>${escapeHtml(libelle)}</button>`;
  }

  private choisir(valeur: string): void {
    const question = this.affichee();
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

  private decompte(resultats: VoteResultats | null): EscapedHtml {
    if (resultats === null) {
      return VIDE;
    }
    return safeHtml`<p class="fp-vote__decompte" data-testid="decompte">${escapeHtml(this.texte('pulse-total'))} ${resultats.total}</p>`;
  }

  private barre({ id, libelle }: OptionPublique, partDesVotes: number): EscapedHtml {
    return safeHtml`<div class="fp-vote__barre" data-testid="barre" data-option="${escapeHtml(id)}"><span class="fp-vote__barre__libelle" data-testid="barre-libelle">${escapeHtml(libelle)}</span><span class="fp-vote__barre__piste"><span class="fp-vote__barre__valeur" data-testid="barre-valeur" style="width:${partDesVotes * 100}%"></span></span><span class="fp-vote__barre__pourcentage">${escapeHtml(formaterPart(partDesVotes))}</span></div>`;
  }

  private histogramme(
    question: VoteQuestionPublique,
    resultats: VoteResultats | null,
  ): EscapedHtml {
    if (!resultats || resultats.total === 0) {
      return safeHtml`<div class="fp-vote__histogramme" data-testid="histogramme"></div>`;
    }
    const barres = this.toutesLesOptions(question).map((option) =>
      this.barre(option, part(resultats.parOption[option.id] ?? 0, resultats.total)),
    );
    return safeHtml`<div class="fp-vote__histogramme" data-testid="histogramme">${barres}</div>`;
  }
}
