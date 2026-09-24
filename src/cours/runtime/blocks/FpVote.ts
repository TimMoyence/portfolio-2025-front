import type { MetadonneesBrique, VotePhase } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';
import {
  estObjet,
  estVerdictDeReponse,
  lireBonneOption,
  lireBonneReponse,
  type VerdictDeReponse,
} from './retours';

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

const ID_JE_NE_SAIS_PAS = '__je_ne_sais_pas__';
const PHASES: readonly VotePhase[] = ['vote', 'discussion', 'revote', 'revele'];
const VIDE = escapeHtml('');

const TITRES_DES_VOTES: Readonly<Record<'premier' | 'second', string>> = {
  premier: 'vote-premier',
  second: 'vote-second',
};

const ANNONCE_DE_PHASE: Readonly<Record<VotePhase, string>> = {
  vote: 'vote-phase-vote',
  discussion: 'discussion-en-cours',
  revote: 'revoter',
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
  return safeHtml`<li>${escapeHtml(ligne)}</li>`;
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

export class FpVote extends FpBlock {
  private principale: VoteQuestionPublique | null = null;
  private jumelle: VoteQuestionPublique | null = null;
  private internePhase: VotePhase | null = null;
  private interneResultats: VoteResultats | null = null;
  private premierVote: VoteResultats | null = null;
  private revelation: Revelation | null = null;
  private bonneReponse: string | null = null;
  private bonneOption: string | null = null;
  private recus = new Map<string, VerdictDeReponse>();
  private choix = new Map<string, string>();

  set question(valeur: VoteQuestionPublique | null) {
    if ((valeur?.id ?? null) !== (this.principale?.id ?? null)) {
      this.recus = new Map();
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
    this.internePhase = PHASES.find((phase) => phase === valeur) ?? null;
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

  set verdicts(valeur: readonly VerdictDeReponse[] | null) {
    const connus = new Set([this.principale?.id, this.jumelle?.id]);
    this.recus = new Map(
      (valeur ?? [])
        .filter(estVerdictDeReponse)
        .filter((verdict) => connus.has(verdict.questionId))
        .map((verdict) => [verdict.questionId, verdict]),
    );
    this.refreshSiConnecte();
  }

  get verdicts(): readonly VerdictDeReponse[] {
    return [...this.recus.values()];
  }

  set corrige(valeur: unknown) {
    this.revelation = lireRevelation(valeur);
    this.bonneReponse = lireBonneReponse(valeur);
    this.bonneOption = lireBonneOption(valeur);
    this.refreshSiConnecte();
  }

  get questionAffichee(): VoteQuestionPublique | null {
    const surLaJumelle = this.internePhase === 'revote' || this.internePhase === 'revele';
    return surLaJumelle && this.jumelle !== null ? this.jumelle : this.principale;
  }

  render(): EscapedHtml {
    const question = this.questionAffichee;
    if (!question) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const neSaitPas = this.presentateur()
      ? VIDE
      : this.bouton(
          question,
          ID_JE_NE_SAIS_PAS,
          this.texte('je-ne-sais-pas'),
          'fp-vote__option fp-vote__option--neutre',
        );
    return safeHtml`<div class="fp-carte fp-scene">
      ${this.annoncePhase()}
      <fieldset class="fp-vote__options">
        <legend class="fp-enonce">${escapeHtml(question.enonce)}</legend>
        ${question.options.map((option) => this.bouton(question, option.id, option.libelle, 'fp-vote__option'))}
        ${neSaitPas}
      </fieldset>
      ${this.presentateur() ? this.suiviProjete(question) : this.suiviEtudiant(question)}
      ${this.bonneReponseRevelee()}${this.revelationRevelee()}
    </div>`;
  }

  private suiviEtudiant(question: VoteQuestionPublique): EscapedHtml {
    const retour = this.choix.has(question.id) ? this.messageApresEnvoi() : '';
    const verdict = this.verdictVisible() ? (this.recus.get(question.id) ?? null) : null;
    return safeHtml`<p aria-live="polite" data-testid="retour">${escapeHtml(retour)}</p>${this.verdictDeReponse(verdict)}${this.annonces()}`;
  }

  private suiviProjete(question: VoteQuestionPublique): EscapedHtml {
    if (this.internePhase === 'discussion' && this.surDeuxTemps()) {
      return this.histogramme(question, this.interneResultats, 'premier');
    }
    if (this.internePhase !== 'revele' && !this.cloture) {
      return this.decompte();
    }
    const comparaison =
      this.jumelle !== null && this.principale !== null && this.premierVote !== null
        ? safeHtml`${this.histogramme(this.principale, this.premierVote, 'premier')}${this.histogramme(question, this.interneResultats, 'second')}`
        : this.histogramme(question, this.interneResultats);
    return safeHtml`${comparaison}${this.decompte()}`;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.questionAffichee?.id ?? null);
    const ouverte = !this.presentateur() && this.ouverte();
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.disabled = !ouverte;
      if (ouverte) {
        bouton.addEventListener('click', () => this.choisir(bouton.dataset['option'] ?? ''));
      }
    }
  }

  private surDeuxTemps(): boolean {
    return this.jumelle !== null && this.internePhase !== null;
  }

  private verdictVisible(): boolean {
    return !this.surDeuxTemps() || this.internePhase === 'revele';
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
      (this.choix.has(question.id) && this.erreur === null) || this.recus.has(question.id);
    return !repondue && !this.dejaRepondu && !this.cloture;
  }

  private annoncePhase(): EscapedHtml {
    if (!this.surDeuxTemps() || this.internePhase === null) {
      return VIDE;
    }
    return safeHtml`<p class="fp-vote__phase" role="status" data-testid="phase" data-phase="${escapeHtml(this.internePhase)}">${escapeHtml(this.texte(ANNONCE_DE_PHASE[this.internePhase]))}</p>`;
  }

  private bouton(
    question: VoteQuestionPublique,
    id: string,
    libelle: string,
    classes: string,
  ): EscapedHtml {
    const choisie = this.choix.get(question.id) === id;
    const marque = id === ID_JE_NE_SAIS_PAS ? 'je-ne-sais-pas' : 'option';
    return safeHtml`<button type="button" class="${escapeHtml(classes)}" data-testid="${escapeHtml(marque)}" data-option="${escapeHtml(id)}" aria-pressed="${escapeHtml(String(choisie))}"${this.marqueDeCorrection(id, choisie)}>${escapeHtml(libelle)}</button>`;
  }

  private marqueDeCorrection(id: string, choisie: boolean): EscapedHtml {
    if (this.bonneOption === null) {
      return VIDE;
    }
    if (id === this.bonneOption) {
      return safeHtml` data-correction="juste"`;
    }
    return choisie ? safeHtml` data-correction="fausse"` : VIDE;
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

  private bonneReponseRevelee(): EscapedHtml {
    if (this.bonneReponse === null) {
      return VIDE;
    }
    return safeHtml`<p class="fp-encadre" data-etat="confirme" data-testid="bonne-reponse">${escapeHtml(this.texte('bonne-reponse'))} ${escapeHtml(this.bonneReponse)}</p>`;
  }

  private revelationRevelee(): EscapedHtml {
    const revelation = this.revelation;
    if (revelation === null) {
      return VIDE;
    }
    return safeHtml`<div class="fp-encadre fp-vote__revelation" data-testid="revelation"><p class="fp-vote__titre">${escapeHtml(revelation.titre)}</p><ul>${revelation.lignes.map(elementDeListe)}</ul></div>`;
  }

  private libelleOption(question: VoteQuestionPublique, id: string): string {
    if (id === ID_JE_NE_SAIS_PAS) {
      return this.texte('je-ne-sais-pas');
    }
    return question.options.find((option) => option.id === id)?.libelle ?? id;
  }

  private barre(question: VoteQuestionPublique, id: string, pourcentage: number): EscapedHtml {
    return safeHtml`<div class="fp-vote__barre" data-testid="barre" data-option="${escapeHtml(id)}"><span class="fp-vote__barre__libelle" data-testid="barre-libelle">${escapeHtml(this.libelleOption(question, id))}</span><span class="fp-vote__barre__piste"><span class="fp-vote__barre__valeur" data-testid="barre-valeur" style="width:${pourcentage}%"></span></span><span class="fp-vote__barre__pourcentage">${pourcentage}%</span></div>`;
  }

  private histogramme(
    question: VoteQuestionPublique,
    resultats: VoteResultats | null,
    vote?: 'premier' | 'second',
  ): EscapedHtml {
    const marqueDuVote = vote === undefined ? VIDE : safeHtml` data-vote="${escapeHtml(vote)}"`;
    const titre =
      vote === undefined
        ? VIDE
        : safeHtml`<p class="fp-vote__titre">${escapeHtml(this.texte(TITRES_DES_VOTES[vote]))}</p>`;
    if (!resultats || resultats.total === 0) {
      return safeHtml`<div class="fp-vote__histogramme" data-testid="histogramme"${marqueDuVote}>${titre}</div>`;
    }
    const idsConnus = new Set([...question.options.map((option) => option.id), ID_JE_NE_SAIS_PAS]);
    const barres = [...question.options.map((option) => option.id), ID_JE_NE_SAIS_PAS]
      .filter((id) => idsConnus.has(id))
      .map((id) =>
        this.barre(
          question,
          id,
          Math.round(((resultats.parOption[id] ?? 0) / resultats.total) * 100),
        ),
      );
    return safeHtml`<div class="fp-vote__histogramme" data-testid="histogramme"${marqueDuVote}>${titre}${barres}</div>`;
  }
}
