import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpReponse } from './reponse';
import {
  type ContenuDeBrique,
  type OptionPublique,
  copierLeSocle,
  projeterOptions,
} from './projection';

export interface ExitBilletPublic extends ContenuDeBrique {
  readonly question: string;
  readonly invite: string;
  readonly options: readonly OptionPublique[];
}

const LIMITE_TEXTE_LIBRE = 500;
const ID_TEXTE_LIBRE = 'fp-exit-texte-libre';
const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;

function projeterBillet(source: ExitBilletPublic): ExitBilletPublic {
  return {
    ...copierLeSocle(source),
    question: source.question,
    invite: source.invite,
    options: projeterOptions(source.options),
  };
}

export class FpExit extends FpReponse<ExitBilletPublic> {
  private texteLibre = '';
  private choix: string | null = null;

  set billet(valeur: ExitBilletPublic | null) {
    this.poserLeContenu(valeur, projeterBillet);
    this.refreshSiConnecte();
  }

  get billet(): ExitBilletPublic | null {
    return this.interne;
  }

  protected reprendreLeBrouillon(brouillon: Readonly<Record<string, unknown>>): boolean {
    const texte = brouillon['texteLibre'];
    const choix = brouillon['choix'];
    this.texteLibre = typeof texte === 'string' ? texte : this.texteLibre;
    this.choix = typeof choix === 'string' ? choix : this.choix;
    return true;
  }

  protected rendreLaQuestion(billet: ExitBilletPublic): EscapedHtml {
    const redaction = this.presentateur()
      ? safeHtml`<p class="fp-exit__invite" data-testid="invite">${escapeHtml(billet.invite)}</p>`
      : safeHtml`<label class="fp-exit__invite" for="${escapeHtml(ID_TEXTE_LIBRE)}">${escapeHtml(billet.invite)}</label>
        <textarea class="fp-exit__champ" id="${escapeHtml(ID_TEXTE_LIBRE)}" data-testid="texte-libre" rows="3">${escapeHtml(this.texteLibre)}</textarea>
        <p class="fp-exit__jauge" data-testid="jauge">${this.texteLibre.length} / ${LIMITE_TEXTE_LIBRE}</p>
        <button type="button" class="fp-exit__envoyer" data-testid="envoyer">${escapeHtml(this.texte('envoyer'))}</button>
        <p aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.recapitulatif()}
        ${this.verdictDeReponse(this.interneVerdict)}
        ${this.annonces()}`;
    return safeHtml`
      <fieldset class="fp-carte fp-scene fp-exit__billet">
        <legend class="fp-enonce">${escapeHtml(billet.question)}</legend>
        <div class="fp-exit__choix">${this.boutonsOption(billet.options)}</div>
        ${redaction}
      </fieldset>
    `;
  }

  bind(racine: ShadowRoot): void {
    if (!this.suivreEtSaisir(this.billet?.id ?? null)) {
      return;
    }
    const verrouille = this.verrouille();
    const branche = this.brancherLaSaisie(
      racine,
      { champ: 'texte-libre', bouton: 'envoyer', verrouille },
      {
        saisir: (texte) => {
          this.texteLibre = texte;
          this.memoriser();
        },
        envoyer: (texte) => this.envoyer(texte),
      },
    );
    if (!branche) {
      return;
    }
    for (const bouton of racine.querySelectorAll<HTMLButtonElement>('[data-option]')) {
      bouton.disabled = verrouille;
      bouton.addEventListener('click', () => this.selectionner(bouton.dataset['option'] ?? ''));
    }
  }

  protected effacerLaSaisie(): void {
    this.texteLibre = '';
    this.choix = null;
  }

  private memoriser(): void {
    this.signalerBrouillon(this.interne?.id ?? '', {
      texteLibre: this.texteLibre,
      choix: this.choix,
    });
  }

  private boutonsOption(options: readonly OptionPublique[]): readonly EscapedHtml[] {
    return options.map(
      (option) =>
        safeHtml`<button type="button" class="fp-exit__option" data-testid="option" data-option="${escapeHtml(option.id)}" aria-pressed="${escapeHtml(String(option.id === this.choix))}" ${this.presentateur() ? DESACTIVE : VIDE}>${escapeHtml(option.libelle)}</button>`,
    );
  }

  private recapitulatif(): EscapedHtml {
    if (!this.envoye && this.interneVerdict === null) {
      return escapeHtml('');
    }
    return safeHtml`<div class="fp-exit__recap" data-testid="recap"><p class="fp-exit__recap-choix" data-testid="recap-choix">${escapeHtml(this.libelleChoisi())}</p><p class="fp-exit__recap-texte" data-testid="recap-texte">${escapeHtml(this.texteLibre)}</p></div>`;
  }

  private libelleChoisi(): string {
    return this.billet?.options.find((option) => option.id === this.choix)?.libelle ?? '';
  }

  private messageTropLong(): string {
    return `${this.texte('texte-libre-trop-long')} ${LIMITE_TEXTE_LIBRE} ${this.texte('caracteres-maximum')}`;
  }

  private selectionner(valeur: string): void {
    if (this.verrouille()) {
      return;
    }
    this.choix = valeur;
    this.message = '';
    this.memoriser();
    this.refresh();
  }

  private envoyer(brut: string): void {
    if (this.verrouille()) {
      return;
    }
    this.texteLibre = brut;
    if (this.choix === null) {
      this.refuserLEnvoi(this.texte('choix-obligatoire'));
      return;
    }
    if (brut.length > LIMITE_TEXTE_LIBRE) {
      this.refuserLEnvoi(this.messageTropLong());
      return;
    }
    this.conclureLEnvoi('fp-exit-submit', {
      billetId: this.billet?.id,
      valeur: this.choix,
      texteLibre: brut,
    });
  }
}
