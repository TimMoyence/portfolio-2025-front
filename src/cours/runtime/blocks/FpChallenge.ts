import type { MetadonneesBrique } from '../../content/types';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';
import { type OptionPublique, projeterMetadonnees, projeterOptions } from './projection';

export interface ChallengeStrategie extends OptionPublique {
  readonly fausse: boolean;
}

export interface ChallengeProblemePublic {
  readonly id: string;
  readonly enonce: string;
  readonly invite: string;
  readonly strategies: readonly OptionPublique[];
  readonly metadonnees: MetadonneesBrique;
}

export interface ChallengeProbleme extends ChallengeProblemePublic {
  readonly strategies: readonly ChallengeStrategie[];
}

const ID_TENTATIVE = 'fp-challenge-tentative';

function estStrategieNotee(strategie: OptionPublique): strategie is ChallengeStrategie {
  return 'fausse' in strategie;
}

export class FpChallenge extends FpBlock {
  private interne: ChallengeProblemePublic | null = null;
  private tentative = '';
  private message = '';
  private soumise = false;
  private revele = false;

  set probleme(valeur: ChallengeProblemePublic | null) {
    const change = (valeur?.id ?? null) !== (this.interne?.id ?? null);
    this.interne = valeur === null ? null : this.projeter(valeur);
    if (change) {
      this.tentative = '';
      this.message = '';
      this.soumise = false;
      this.revele = false;
    }
    this.refreshSiConnecte();
  }

  get probleme(): ChallengeProblemePublic | null {
    return this.interne;
  }

  set revelee(valeur: boolean) {
    this.revele = valeur && this.soumise;
    this.refreshSiConnecte();
  }

  get revelee(): boolean {
    return this.revele;
  }

  get tentativeSoumise(): boolean {
    return this.soumise;
  }

  renderHand(): EscapedHtml {
    const probleme = this.probleme;
    if (!probleme) {
      return safeHtml`<p>${escapeHtml(this.texte('chargement'))}</p>`;
    }
    return safeHtml`
      <fieldset class="fp-carte fp-challenge__probleme">
        <legend>${escapeHtml(probleme.enonce)}</legend>
        <p class="fp-challenge__consigne" data-testid="consigne">${escapeHtml(this.texte('challenge-consigne'))}</p>
        <label class="fp-challenge__invite" for="${escapeHtml(ID_TENTATIVE)}">${escapeHtml(probleme.invite)}</label>
        <textarea class="fp-challenge__champ" id="${escapeHtml(ID_TENTATIVE)}" data-testid="tentative" rows="5">${escapeHtml(this.tentative)}</textarea>
        <button type="button" class="fp-challenge__envoyer" data-testid="envoyer">${escapeHtml(this.texte('envoyer'))}</button>
        <button type="button" class="fp-challenge__reveler" data-testid="reveler">${escapeHtml(this.texte('challenge-reveler'))}</button>
        <p class="fp-challenge__retour" aria-live="polite" data-testid="retour">${escapeHtml(this.message)}</p>
        ${this.revelation()}
      </fieldset>
    `;
  }

  renderStage(): EscapedHtml {
    const probleme = this.probleme;
    if (!probleme) {
      return safeHtml``;
    }
    return safeHtml`<div class="fp-carte fp-scene"><p class="fp-enonce">${escapeHtml(probleme.enonce)}</p>${this.revelation()}</div>`;
  }

  renderBoard(): EscapedHtml {
    const probleme = this.probleme;
    if (!probleme) {
      return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('en-attente'))}</p>`;
    }
    const metadonnees = probleme.metadonnees;
    return safeHtml`
      <div class="fp-carte fp-challenge__probleme">
        <p class="fp-enonce">${escapeHtml(probleme.enonce)}</p>
        <p class="fp-challenge__concepts" data-testid="concepts">${escapeHtml(metadonnees.concepts.join(' · '))}</p>
        <p class="fp-badge" data-testid="modalite">${escapeHtml(metadonnees.modalite)}</p>
        ${this.revelation()}
      </div>
    `;
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.probleme?.id ?? null);
    if (this.mode() !== 'hand') {
      return;
    }
    const champ = racine.querySelector<HTMLTextAreaElement>('[data-testid="tentative"]');
    const envoyer = racine.querySelector<HTMLButtonElement>('[data-testid="envoyer"]');
    const reveler = racine.querySelector<HTMLButtonElement>('[data-testid="reveler"]');
    if (champ === null || envoyer === null || reveler === null) {
      return;
    }
    champ.disabled = this.soumise;
    envoyer.disabled = this.soumise;
    reveler.disabled = !this.soumise;
    champ.addEventListener('input', () => {
      this.tentative = champ.value;
    });
    envoyer.addEventListener('click', () => this.envoyer(champ.value));
    reveler.addEventListener('click', () => {
      this.revelee = true;
    });
  }

  private projeter(source: ChallengeProblemePublic): ChallengeProblemePublic {
    return {
      id: source.id,
      enonce: source.enonce,
      invite: source.invite,
      strategies:
        this.roleActuel() === 'presentateur'
          ? source.strategies
          : projeterOptions(source.strategies),
      metadonnees: projeterMetadonnees(source.metadonnees),
    };
  }

  private marque(strategie: OptionPublique): EscapedHtml {
    if (!estStrategieNotee(strategie) || !strategie.fausse) {
      return escapeHtml('');
    }
    return safeHtml`<span class="fp-challenge__marque" data-testid="marque">${escapeHtml(this.texte('challenge-fausse'))}</span>`;
  }

  private revelation(): EscapedHtml {
    const probleme = this.probleme;
    if (probleme === null || !this.revele) {
      return escapeHtml('');
    }
    const lignes = probleme.strategies.map(
      (strategie) =>
        safeHtml`<li class="fp-challenge__strategie" data-testid="strategie" data-strategie="${escapeHtml(strategie.id)}"><span class="fp-challenge__libelle">${escapeHtml(strategie.libelle)}</span>${this.marque(strategie)}</li>`,
    );
    return safeHtml`<div class="fp-challenge__revelation" data-testid="revelation"><p class="fp-challenge__titre">${escapeHtml(this.texte('challenge-strategies'))}</p><ul class="fp-challenge__strategies">${lignes}</ul></div>`;
  }

  private envoyer(brut: string): void {
    if (this.soumise) {
      return;
    }
    this.tentative = brut;
    if (brut.trim().length === 0) {
      this.message = this.texte('challenge-tentative-vide');
      this.refresh();
      return;
    }
    this.soumise = true;
    this.message = this.texte('reponse-enregistree');
    this.emit('fp-challenge-submit', {
      problemeId: this.probleme?.id,
      tentative: brut,
      dureeMs: this.depuisAffichage(),
    });
    this.refresh();
  }
}
