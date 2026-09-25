import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { type ContenuDeBrique, copierLeSocle } from './projection';
import { FpRedaction } from './redaction';

export interface QuestionLibre {
  readonly id: string;
  readonly question: string;
  readonly placeholder?: string;
}

export interface ProCas extends ContenuDeBrique {
  readonly metier: string;
  readonly situation: string;
  readonly geste: string;
  readonly consequence: string | null;
  readonly questionsLibres?: readonly QuestionLibre[];
}

const LONGUEUR_MAX_REPONSE_LIBRE = 10000;

function copierQuestion({ id, question, placeholder }: QuestionLibre): QuestionLibre {
  return placeholder === undefined ? { id, question } : { id, question, placeholder };
}

function copierCas(source: ProCas): ProCas {
  return {
    ...copierLeSocle(source),
    metier: source.metier,
    situation: source.situation,
    geste: source.geste,
    consequence: source.consequence,
    ...(source.questionsLibres === undefined
      ? {}
      : { questionsLibres: source.questionsLibres.map(copierQuestion) }),
  };
}

export class FpPro extends FpRedaction<ProCas> {
  protected readonly cleDuBrouillon = 'reponses';

  set cas(valeur: ProCas | null) {
    this.poserLeContenu(valeur, copierCas);
    this.refreshSiConnecte();
  }

  get cas(): ProCas | null {
    return this.interne;
  }

  render(): EscapedHtml {
    if (this.cas === null) {
      return this.attente();
    }
    return this.dossier(this.questionsLibres());
  }

  bind(racine: ShadowRoot): void {
    if (!this.suivreEtSaisir(this.interne?.id ?? null) || this.questions().length === 0) {
      return;
    }
    const verrouille = this.verrouille();
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
        ${this.metier(cas)}
        <div class="fp-prose fp-pro__corps">
          <p class="fp-pro__situation" data-testid="situation">${escapeHtml(cas.situation)}</p>
          ${this.geste(cas)}
          ${this.consequence(cas)}
        </div>
        ${suite}
      </aside>
    `;
  }

  private metier(cas: ProCas): EscapedHtml {
    if (cas.metier.trim().length === 0) {
      return safeHtml``;
    }
    return safeHtml`<p class="fp-badge fp-pro__metier" data-testid="metier">${escapeHtml(cas.metier)}</p>`;
  }

  private geste(cas: ProCas): EscapedHtml {
    if (cas.geste.trim().length === 0) {
      return safeHtml``;
    }
    return safeHtml`<div class="fp-encadre fp-pro__geste">
      <h3 class="fp-pro__intitule">${escapeHtml(this.texte('pro-geste'))}</h3>
      <p class="fp-pro__geste-texte" data-testid="geste">${escapeHtml(cas.geste)}</p>
    </div>`;
  }

  private consequence(cas: ProCas): EscapedHtml {
    const retombee = cas.consequence;
    if (retombee === null || retombee.trim().length === 0) {
      return safeHtml``;
    }
    return safeHtml`<p class="fp-pro__consequence" data-testid="consequence">${escapeHtml(this.texte('pro-consequence'))} ${escapeHtml(retombee)}</p>`;
  }

  private questionsLibres(): EscapedHtml {
    const questions = this.questions();
    if (questions.length === 0) {
      return safeHtml``;
    }
    const projetees = this.presentateur();
    const lignes = questions.map((question) =>
      projetees ? this.enonce(question) : this.champ(question),
    );
    const envoi = projetees
      ? safeHtml``
      : safeHtml`<button type="button" class="fp-pro__valider" data-testid="valider">${escapeHtml(this.texte('valider'))}</button>
        <p class="fp-pro__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>`;
    return safeHtml`
      <div class="fp-prose fp-pro__reponses">
        <ol class="fp-pro__questions">${lignes}</ol>
        ${envoi}
      </div>
      ${projetees ? safeHtml`` : this.annonces()}
    `;
  }

  private enonce(question: QuestionLibre): EscapedHtml {
    return safeHtml`<li class="fp-pro__question" data-testid="question-libre">${escapeHtml(question.question)}</li>`;
  }

  private champ(question: QuestionLibre): EscapedHtml {
    const identifiant = `fp-pro-reponse-${question.id}`;
    return safeHtml`
      <li class="fp-pro__question">
        <label class="fp-pro__libelle" for="${escapeHtml(identifiant)}">${escapeHtml(question.question)}</label>
        <textarea class="fp-pro__champ" id="${escapeHtml(identifiant)}" data-question="${escapeHtml(question.id)}" placeholder="${escapeHtml(question.placeholder ?? '')}" maxlength="${LONGUEUR_MAX_REPONSE_LIBRE}" rows="3">${escapeHtml(this.texteDe(question.id))}</textarea>
      </li>
    `;
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
    if (cas === null || this.verrouille()) {
      return;
    }
    const cles = this.questions().map((question) => question.id);
    if (this.manqueUnTexte(cles)) {
      this.refuserLEnvoi(this.texte('pro-reponse-vide'));
      return;
    }
    this.conclureLEnvoi('fp-pro-submit', { casId: cas.id, reponses: this.textesDe(cles) });
  }
}
