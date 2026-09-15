import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { shuffleWithSeed } from '../core/seed';
import { FpBlock } from './FpBlock';

export interface VoteOptionPublique {
  id: string;
  libelle: string;
}

export interface VoteOption extends VoteOptionPublique {
  misconception: string | null;
}

export interface VoteQuestionPublique {
  id: string;
  enonce: string;
  options: readonly VoteOptionPublique[];
}

export interface VoteQuestion extends VoteQuestionPublique {
  options: readonly VoteOption[];
  readonly metadonnees: MetadonneesBrique;
}

export interface VoteResultats {
  total: number;
  parOption: Readonly<Record<string, number>>;
}

export type VotePhase = 'vote' | 'discussion' | 'revote' | 'revele';

const SEUIL_DEFAUT = 0.7;
const ID_JE_NE_SAIS_PAS = '__je_ne_sais_pas__';

export class FpVote extends FpBlock {
  private interne: VoteQuestionPublique | null = null;
  private interneResultats: VoteResultats | null = null;
  private internePhase: VotePhase = 'vote';
  private interneSeuil = SEUIL_DEFAUT;
  private repondu = false;

  set question(valeur: VoteQuestionPublique | null) {
    this.interne =
      valeur === null || this.roleActuel() === 'presentateur'
        ? valeur
        : {
            id: valeur.id,
            enonce: valeur.enonce,
            options: valeur.options.map((option) => ({
              id: option.id,
              libelle: option.libelle,
            })),
          };
    this.refreshSiConnecte();
  }

  get question(): VoteQuestionPublique | null {
    return this.interne;
  }

  set resultats(valeur: VoteResultats | null) {
    this.interneResultats = valeur;
    this.refreshSiConnecte();
  }

  get resultats(): VoteResultats | null {
    return this.interneResultats;
  }

  set phase(valeur: VotePhase) {
    this.internePhase = valeur;
    this.emit('fp-vote-phase', { phase: valeur });
    this.refreshSiConnecte();
  }

  get phase(): VotePhase {
    return this.internePhase;
  }

  set seuil(valeur: number) {
    this.interneSeuil = valeur;
    this.refreshSiConnecte();
  }

  get seuil(): number {
    return this.interneSeuil;
  }

  renderHand(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    const options = shuffleWithSeed([...question.options], this.seed());
    const boutons = options.map(
      (option) =>
        safeHtml`<button type="button" class="fp-vote__option" data-testid="option" data-option="${escapeHtml(option.id)}">${escapeHtml(option.libelle)}</button>`,
    );
    const retour = this.repondu ? escapeHtml(this.texte('reponse-enregistree')) : escapeHtml('');
    return safeHtml`
      <fieldset class="fp-carte">
        <legend>${escapeHtml(question.enonce)}</legend>
        ${boutons}
        <button type="button" class="fp-vote__option fp-vote__option--neutre" data-testid="je-ne-sais-pas" data-option="${escapeHtml(ID_JE_NE_SAIS_PAS)}">
          ${escapeHtml(this.texte('je-ne-sais-pas'))}
        </button>
      </fieldset>
      <p aria-live="polite" data-testid="retour">${retour}</p>
    `;
  }

  renderStage(): EscapedHtml {
    const question = this.question;
    if (!question) {
      return safeHtml``;
    }
    if (!this.resultats) {
      return safeHtml`<div class="fp-carte fp-scene"><p class="fp-enonce">${escapeHtml(question.enonce)}</p><p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p></div>`;
    }
    return safeHtml`<div class="fp-carte fp-scene"><p class="fp-enonce">${escapeHtml(question.enonce)}</p>${this.histogramme()}</div>`;
  }

  renderBoard(): EscapedHtml {
    if (!this.question || !this.resultats) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const taux = this.tauxReussite();
    const dominante = this.erreurDominante();
    const verdict = taux < this.seuil ? 'Réexpliquer' : 'Passer à la suite';
    return safeHtml`
      <div class="fp-carte">
        ${this.histogramme()}
        <p data-testid="erreur-dominante">Erreur dominante : ${escapeHtml(dominante ?? 'aucune')}</p>
        <p data-testid="verdict" class="fp-vote__verdict">${escapeHtml(verdict)}</p>
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.question?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    const verrouille = this.repondu && this.phase !== 'revote';
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.disabled = verrouille;
      bouton.addEventListener('click', () => this.choisir(bouton.dataset['option'] ?? ''));
    }
  }

  private choisir(valeur: string): void {
    if (this.repondu && this.phase !== 'revote') {
      return;
    }
    this.repondu = true;
    this.emit('fp-vote-submit', {
      questionId: this.question?.id,
      valeur,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }

  private optionsNotees(): readonly VoteOption[] {
    const options = this.question?.options ?? [];
    return options.filter((option): option is VoteOption => 'misconception' in option);
  }

  private idOptionCorrecte(): string | undefined {
    return this.optionsNotees().find((option) => option.misconception === null)?.id;
  }

  private tauxReussite(): number {
    const resultats = this.resultats;
    if (!resultats || resultats.total === 0) {
      return 0;
    }
    const idCorrecte = this.idOptionCorrecte();
    const correctes = idCorrecte ? (resultats.parOption[idCorrecte] ?? 0) : 0;
    return correctes / resultats.total;
  }

  private erreurDominante(): string | null {
    const resultats = this.resultats;
    if (!resultats) {
      return null;
    }
    const idCorrecte = this.idOptionCorrecte();
    let dominante: { misconception: string; total: number } | null = null;
    for (const option of this.optionsNotees()) {
      if (option.id === idCorrecte || option.misconception === null) {
        continue;
      }
      const total = resultats.parOption[option.id] ?? 0;
      if (!dominante || total > dominante.total) {
        dominante = { misconception: option.misconception, total };
      }
    }
    return dominante?.misconception ?? null;
  }

  private idsOptionsConnues(): ReadonlySet<string> {
    const ids = this.question?.options.map((option) => option.id) ?? [];
    return new Set([...ids, ID_JE_NE_SAIS_PAS]);
  }

  private libelleOption(id: string): string {
    if (id === ID_JE_NE_SAIS_PAS) {
      return this.texte('je-ne-sais-pas');
    }
    return this.question?.options.find((option) => option.id === id)?.libelle ?? id;
  }

  private barre(id: string, pourcentage: number): EscapedHtml {
    return safeHtml`<div class="fp-vote__barre" data-testid="barre" data-option="${escapeHtml(id)}"><span class="fp-vote__barre__libelle" data-testid="barre-libelle">${escapeHtml(this.libelleOption(id))}</span><span class="fp-vote__barre__piste"><span class="fp-vote__barre__valeur" data-testid="barre-valeur" style="width:${pourcentage}%"></span></span><span class="fp-vote__barre__pourcentage">${pourcentage}%</span></div>`;
  }

  private histogramme(): EscapedHtml {
    const resultats = this.resultats;
    if (!resultats || resultats.total === 0) {
      return safeHtml`<p data-testid="histogramme"></p>`;
    }
    const idsConnus = this.idsOptionsConnues();
    const barres = Object.entries(resultats.parOption)
      .filter(([id]) => idsConnus.has(id))
      .map(([id, total]) => this.barre(id, Math.round((total / resultats.total) * 100)));
    return safeHtml`<div class="fp-vote__histogramme" data-testid="histogramme">${barres}</div>`;
  }
}
