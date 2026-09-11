import { shuffleWithSeed } from '../core/seed';
import { FpBlock } from './FpBlock';

export interface VoteOptionPublique {
  id: string;
  libelle: string;
}

export interface VoteOption extends VoteOptionPublique {
  misconception: string | null;
}

export interface VoteQuestion {
  id: string;
  enonce: string;
  options: readonly VoteOption[];
}

export interface VoteResultats {
  total: number;
  parOption: Readonly<Record<string, number>>;
}

export type VotePhase = 'vote' | 'discussion' | 'revote' | 'revele';

const SEUIL_DEFAUT = 0.7;

export class FpVote extends FpBlock {
  seuil = SEUIL_DEFAUT;
  phase: VotePhase = 'vote';

  private interne: VoteQuestion | null = null;
  private interneResultats: VoteResultats | null = null;
  private affiche = 0;
  private repondu = false;

  set question(valeur: VoteQuestion | null) {
    this.interne =
      valeur === null || this.roleActuel() === 'presentateur'
        ? valeur
        : {
            ...valeur,
            options: valeur.options.map((option) => ({
              id: option.id,
              libelle: option.libelle,
            })) as unknown as readonly VoteOption[],
          };
    this.actualiseSiConnecte();
  }

  get question(): VoteQuestion | null {
    return this.interne;
  }

  set resultats(valeur: VoteResultats | null) {
    this.interneResultats = valeur;
    this.actualiseSiConnecte();
  }

  get resultats(): VoteResultats | null {
    return this.interneResultats;
  }

  renderHand(): string {
    const question = this.question;
    if (!question) {
      return `<p>${this.texte('chargement')}</p>`;
    }
    const options = shuffleWithSeed([...question.options], this.seed());
    const boutons = options
      .map(
        (option) =>
          `<button type="button" class="fp-option" data-testid="option" data-option="${option.id}">${option.libelle}</button>`,
      )
      .join('');
    return `
      <fieldset class="fp-carte">
        <legend>${question.enonce}</legend>
        ${boutons}
        <button type="button" class="fp-option fp-option--neutre" data-testid="je-ne-sais-pas" data-option="__je_ne_sais_pas__">
          ${this.texte('je-ne-sais-pas')}
        </button>
      </fieldset>
      <p aria-live="polite" data-testid="retour"></p>
    `;
  }

  renderStage(): string {
    const question = this.question;
    if (!question) {
      return '';
    }
    if (!this.resultats) {
      return `<div class="fp-carte fp-scene"><p class="fp-enonce">${question.enonce}</p><p data-testid="attente">${this.texte('en-attente')}</p></div>`;
    }
    return `<div class="fp-carte fp-scene"><p class="fp-enonce">${question.enonce}</p>${this.histogramme()}</div>`;
  }

  renderBoard(): string {
    if (!this.question || !this.resultats) {
      return `<p data-testid="attente">${this.texte('en-attente')}</p>`;
    }
    const taux = this.tauxReussite();
    const dominante = this.erreurDominante();
    const verdict = taux < this.seuil ? 'Réexpliquer' : 'Passer à la suite';
    return `
      <div class="fp-carte">
        ${this.histogramme()}
        <p data-testid="erreur-dominante">Erreur dominante : ${dominante ?? 'aucune'}</p>
        <p data-testid="verdict" class="fp-verdict">${verdict}</p>
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.affiche = Date.now();
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
      dureeMs: Date.now() - this.affiche,
    });
    this.refresh();
  }

  private actualiseSiConnecte(): void {
    if (this.isConnected) {
      this.refresh();
    }
  }

  private idOptionCorrecte(): string | undefined {
    return this.question?.options.find((option) => option.misconception === null)?.id;
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
    const question = this.question;
    const resultats = this.resultats;
    if (!question || !resultats) {
      return null;
    }
    const idCorrecte = this.idOptionCorrecte();
    let dominante: { misconception: string; total: number } | null = null;
    for (const option of question.options) {
      if (option.id === idCorrecte || typeof option.misconception !== 'string') {
        continue;
      }
      const total = resultats.parOption[option.id] ?? 0;
      if (!dominante || total > dominante.total) {
        dominante = { misconception: option.misconception, total };
      }
    }
    return dominante?.misconception ?? null;
  }

  private histogramme(): string {
    const resultats = this.resultats;
    if (!resultats || resultats.total === 0) {
      return `<p data-testid="histogramme"></p>`;
    }
    const barres = Object.entries(resultats.parOption)
      .map(([id, total]) => {
        const pourcentage = Math.round((total / resultats.total) * 100);
        return `<div class="fp-barre" data-testid="barre" data-option="${id}"><span class="fp-barre__valeur" style="width:${pourcentage}%"></span><span class="fp-barre__pourcentage">${pourcentage}%</span></div>`;
      })
      .join('');
    return `<div class="fp-histogramme" data-testid="histogramme">${barres}</div>`;
  }
}
