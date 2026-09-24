import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { projeterMetadonnees } from './projection';
import { estObjet } from './retours';

export interface QuestionLibre {
  readonly id: string;
  readonly question: string;
  readonly placeholder?: string;
}

export interface ProCas {
  readonly id: string;
  readonly metier: string;
  readonly situation: string;
  readonly geste: string;
  readonly consequence: string | null;
  readonly questionsLibres?: readonly QuestionLibre[];
  readonly metadonnees: MetadonneesBrique;
}

type Reponses = Readonly<Record<string, string>>;

const LONGUEUR_MAX_REPONSE_LIBRE = 10000;

function copierQuestion({ id, question, placeholder }: QuestionLibre): QuestionLibre {
  return placeholder === undefined ? { id, question } : { id, question, placeholder };
}

function lireReponses(valeur: unknown): Reponses {
  if (!estObjet(valeur)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(valeur).filter(
      (entree): entree is [string, string] => typeof entree[1] === 'string',
    ),
  );
}

export class FpPro extends FpBlock {
  private interne: ProCas | null = null;
  private reponses: Reponses = {};
  private message = '';
  private soumise = false;

  set cas(valeur: ProCas | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne =
      valeur === null
        ? null
        : {
            id: valeur.id,
            metier: valeur.metier,
            situation: valeur.situation,
            geste: valeur.geste,
            consequence: valeur.consequence,
            ...(valeur.questionsLibres === undefined
              ? {}
              : { questionsLibres: valeur.questionsLibres.map(copierQuestion) }),
            metadonnees: projeterMetadonnees(valeur.metadonnees),
          };
    if (change) {
      this.reponses = {};
      this.message = '';
      this.soumise = false;
    }
    this.refreshSiConnecte();
  }

  get cas(): ProCas | null {
    return this.interne;
  }

  set brouillon(valeur: unknown) {
    if (!estObjet(valeur) || this.soumise) {
      return;
    }
    this.reponses = lireReponses(valeur['reponses']);
    this.noterBrouillonRepris();
    this.refreshSiConnecte();
  }

  render(): EscapedHtml {
    if (this.cas === null) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return this.dossier(this.presentateur() ? this.enonces() : this.formulaire());
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    if (this.presentateur() || this.questions().length === 0) {
      return;
    }
    const verrouille = this.verrouilleApresEnvoi(this.soumise, false);
    for (const champ of racine.querySelectorAll<HTMLTextAreaElement>('textarea[data-question]')) {
      const cle = champ.dataset['question'] ?? '';
      champ.disabled = verrouille;
      champ.addEventListener('input', () => {
        this.noter(cle, champ.value);
        this.effacerRappel(racine);
      });
    }
    const valider = racine.querySelector<HTMLButtonElement>('[data-testid="valider"]');
    if (valider !== null) {
      valider.disabled = verrouille;
      valider.addEventListener('click', () => this.valider());
    }
  }

  private questions(): readonly QuestionLibre[] {
    return this.interne?.questionsLibres ?? [];
  }

  private dossier(suite: EscapedHtml): EscapedHtml {
    const cas = this.cas;
    if (cas === null) {
      return safeHtml``;
    }
    return safeHtml`
      <aside class="fp-scene fp-pro__cas">
        <p class="fp-badge fp-pro__metier" data-testid="metier">${escapeHtml(cas.metier)}</p>
        <div class="fp-prose fp-pro__corps">
          <p class="fp-pro__situation" data-testid="situation">${escapeHtml(cas.situation)}</p>
          <div class="fp-encadre fp-pro__geste">
            <h3 class="fp-pro__intitule">${escapeHtml(this.texte('pro-geste'))}</h3>
            <p class="fp-pro__geste-texte" data-testid="geste">${escapeHtml(cas.geste)}</p>
          </div>
          ${this.consequence(cas)}
        </div>
        ${suite}
      </aside>
    `;
  }

  private consequence(cas: ProCas): EscapedHtml {
    const retombee = cas.consequence;
    if (retombee === null || retombee.trim().length === 0) {
      return safeHtml``;
    }
    return safeHtml`<p class="fp-pro__consequence" data-testid="consequence">${escapeHtml(this.texte('pro-consequence'))} ${escapeHtml(retombee)}</p>`;
  }

  private enonces(): EscapedHtml {
    const questions = this.questions();
    if (questions.length === 0) {
      return safeHtml``;
    }
    return safeHtml`
      <div class="fp-prose fp-pro__reponses">
        <ol class="fp-pro__questions">
          ${questions.map(
            (question) =>
              safeHtml`<li class="fp-pro__question" data-testid="question-libre">${escapeHtml(question.question)}</li>`,
          )}
        </ol>
      </div>
    `;
  }

  private formulaire(): EscapedHtml {
    const questions = this.questions();
    if (questions.length === 0) {
      return safeHtml``;
    }
    return safeHtml`
      <div class="fp-prose fp-pro__reponses">
        <ol class="fp-pro__questions">${questions.map((question) => this.champ(question))}</ol>
        <button type="button" class="fp-pro__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        <p class="fp-pro__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
      </div>
      ${this.annonces()}
    `;
  }

  private champ(question: QuestionLibre): EscapedHtml {
    const identifiant = `fp-pro-reponse-${question.id}`;
    return safeHtml`
      <li class="fp-pro__question">
        <label class="fp-pro__libelle" for="${escapeHtml(identifiant)}">${escapeHtml(question.question)}</label>
        <textarea class="fp-pro__champ" id="${escapeHtml(identifiant)}" data-question="${escapeHtml(question.id)}" placeholder="${escapeHtml(question.placeholder ?? '')}" maxlength="${LONGUEUR_MAX_REPONSE_LIBRE}" rows="3">${escapeHtml(this.reponses[question.id] ?? '')}</textarea>
      </li>
    `;
  }

  private noter(cle: string, valeur: string): void {
    this.reponses = { ...this.reponses, [cle]: valeur };
    this.signalerBrouillon(this.interne?.id ?? '', { reponses: this.reponses });
  }

  private effacerRappel(racine: ShadowRoot): void {
    if (this.message.length === 0) {
      return;
    }
    this.message = '';
    const retour = racine.querySelector<HTMLElement>('[data-testid="retour"]');
    if (retour !== null) {
      retour.textContent = '';
    }
  }

  private valider(): void {
    const cas = this.interne;
    if (cas === null || this.verrouilleApresEnvoi(this.soumise, false)) {
      return;
    }
    const questions = this.questions();
    const manquante = questions.some(
      (question) => (this.reponses[question.id] ?? '').trim().length === 0,
    );
    if (manquante) {
      this.message = this.texte('pro-reponse-vide');
      this.refresh();
      return;
    }
    this.soumise = true;
    this.message = this.messageApresEnvoi();
    this.emit('fp-pro-submit', {
      casId: cas.id,
      reponses: Object.fromEntries(
        questions.map((question) => [question.id, this.reponses[question.id] ?? '']),
      ),
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
