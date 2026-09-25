import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import {
  type Reglages,
  borner,
  changeQuelqueChose,
  jouerSuite,
  poserEtape,
  suiteVersLeMaximum,
} from './animation';
import { type ParametreReglable, brancherCurseurs, curseur } from './curseurs';
import { FpBlock } from './FpBlock';
import { type ContenuDeBrique, copierLeSocle } from './projection';

export interface Prereglage {
  readonly libelle: string;
  readonly valeurs: Readonly<Record<string, number>>;
}

export interface DefinitionReglable extends ContenuDeBrique {
  readonly parametres: readonly ParametreReglable[];
  readonly prereglages?: readonly Prereglage[];
  readonly animation?: readonly Reglages[];
}

export function fini(valeur: number, repli: number): number {
  return Number.isFinite(valeur) ? valeur : repli;
}

export function arrondi(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

export function formater(valeur: number): string {
  return Number.isFinite(valeur) ? String(arrondi(valeur)).replace('.', ',') : '—';
}

export function plancherDe(bornes: { readonly min: number; readonly max: number }): number {
  return fini(bornes.min, 0);
}

export function plafondDe(bornes: { readonly min: number; readonly max: number }): number {
  const bas = plancherDe(bornes);
  return Math.max(fini(bornes.max, bas), bas);
}

function copierParametres(source: readonly ParametreReglable[]): ParametreReglable[] {
  return source
    .filter((parametre) => parametre.cle.trim().length > 0)
    .map((parametre) => ({
      cle: parametre.cle,
      libelle: parametre.libelle,
      min: parametre.min,
      max: parametre.max,
      pas: parametre.pas,
      defaut: parametre.defaut,
    }));
}

function copierPrereglages(source: readonly Prereglage[] | undefined): Prereglage[] {
  return (source ?? []).map(({ libelle, valeurs }) => ({ libelle, valeurs: { ...valeurs } }));
}

export function copierLeReglable(source: DefinitionReglable): DefinitionReglable {
  return {
    ...copierLeSocle(source),
    parametres: copierParametres(source.parametres),
    prereglages: copierPrereglages(source.prereglages),
    animation: source.animation?.map((etape) => ({ ...etape })),
  };
}

export abstract class FpReglable<Definition extends DefinitionReglable> extends FpBlock {
  protected interne: Definition | null = null;
  protected courantes: Record<string, number> = {};
  private arretDeLAnimation: (() => void) | null = null;

  protected abstract readonly evenementDeReglage: string;

  protected abstract readonly bloc: string;

  protected abstract copier(valeur: Definition): Definition;

  protected abstract rafraichirLeRendu(): void;

  set definition(valeur: Definition | null) {
    this.arreterAnimation();
    this.interne = valeur === null ? null : this.copier(valeur);
    this.courantes = {};
    this.apresDefinition?.();
    for (const parametre of this.interne?.parametres ?? []) {
      this.courantes[parametre.cle] = borner(parametre, parametre.defaut);
    }
    this.refreshSiConnecte();
  }

  get definition(): Definition | null {
    return this.interne;
  }

  get valeurs(): Reglages {
    return { ...this.courantes };
  }

  set reglages(valeur: Reglages | null) {
    const parametres = this.interne?.parametres ?? [];
    if (valeur === null || !changeQuelqueChose(parametres, this.courantes, valeur)) {
      return;
    }
    this.arreterAnimation();
    for (const parametre of parametres) {
      const pilote = valeur[parametre.cle];
      if (typeof pilote === 'number') {
        this.courantes[parametre.cle] = borner(parametre, pilote);
      }
    }
    this.refreshSiConnecte();
  }

  disconnectedCallback(): void {
    this.arreterAnimation();
  }

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.interne?.id ?? null);
    racine
      .querySelector<HTMLButtonElement>('[data-testid="animer"]')
      ?.addEventListener('click', () => {
        this.animer();
      });
    brancherCurseurs(racine, (cle, valeur) => this.regler(cle, valeur));
    racine.querySelectorAll<HTMLButtonElement>('[data-testid="prereglage"]').forEach((bouton) => {
      bouton.addEventListener('click', () => {
        this.appliquerPrereglage(Number(bouton.dataset['rang']));
        this.relayerReglages();
      });
    });
    for (const curseur of racine.querySelectorAll('input[data-testid="curseur"]')) {
      curseur.addEventListener('change', () => this.relayerReglages());
    }
  }

  protected apresDefinition?(): void;

  protected apresReglage?(cle: string): void;

  protected apresEtape?(etape: Reglages): void;

  protected afficherValeur(valeur: number): string {
    return formater(valeur);
  }

  protected estActif(prereglage: Prereglage | undefined): boolean {
    return (
      prereglage !== undefined &&
      Object.entries(prereglage.valeurs).every(([cle, valeur]) => this.courantes[cle] === valeur)
    );
  }

  protected valeurDe(parametre: ParametreReglable, valeurs: Reglages = this.courantes): number {
    return borner(parametre, fini(valeurs[parametre.cle], parametre.defaut));
  }

  protected panneauDeReglages(declencheurs: EscapedHtml): EscapedHtml {
    const bloc = escapeHtml(this.bloc);
    return safeHtml`
      <fieldset class="fp-${bloc}__reglages">
        <legend>${escapeHtml(this.texteDuBloc('reglages'))}</legend>
        ${declencheurs}
        <div class="fp-${bloc}__parametres" aria-live="polite">
          ${(this.interne?.parametres ?? []).map((parametre) => this.parametreAffiche(parametre))}
        </div>
      </fieldset>
    `;
  }

  protected boutonAnimer(): EscapedHtml {
    return safeHtml`<button class="fp-${escapeHtml(this.bloc)}__animation" data-testid="animer" type="button">${escapeHtml(this.texteDuBloc('animer'))}</button>`;
  }

  protected prereglagesAffiches(): EscapedHtml {
    const prereglages = this.interne?.prereglages ?? [];
    if (prereglages.length === 0) {
      return safeHtml``;
    }
    const boutons = prereglages.map(
      (prereglage, rang) =>
        safeHtml`<button class="fp-${escapeHtml(this.bloc)}__prereglage" data-testid="prereglage" data-rang="${rang}" type="button" aria-pressed="${escapeHtml(String(this.estActif(prereglage)))}">${escapeHtml(prereglage.libelle)}</button>`,
    );
    return safeHtml`<div class="fp-${escapeHtml(this.bloc)}__prereglages" role="group" aria-label="${escapeHtml(this.texteDuBloc('prereglages'))}">${boutons}</div>`;
  }

  private parametreAffiche(parametre: ParametreReglable): EscapedHtml {
    const bloc = escapeHtml(this.bloc);
    const valeur = this.valeurDe(parametre);
    const enonce = this.enonceValeur(parametre, valeur);
    const prefixe = `fp-${this.bloc}`;
    return safeHtml`
      <div class="fp-${bloc}__parametre" data-testid="parametre" data-cle="${escapeHtml(parametre.cle)}">
        <span class="fp-${bloc}__etiquette">${escapeHtml(parametre.libelle)}</span>
        ${curseur(prefixe, parametre, valeur, enonce)}
        <output class="fp-${bloc}__valeur fp-montant" data-testid="valeur" data-cle="${escapeHtml(parametre.cle)}" aria-label="${escapeHtml(enonce)}">${escapeHtml(this.afficherValeur(valeur))}</output>
      </div>
    `;
  }

  private enonceValeur(parametre: ParametreReglable, valeur: number): string {
    const plage = `${this.texteDuBloc('plage')} ${this.afficherValeur(plancherDe(parametre))} ${this.texteDuBloc('plage-fin')} ${this.afficherValeur(plafondDe(parametre))}`;
    return `${parametre.libelle} : ${this.afficherValeur(valeur)} (${plage})`;
  }

  private texteDuBloc(suffixe: string): string {
    return this.texte([this.bloc, suffixe].join('-'));
  }

  private relayerReglages(): void {
    if (this.presentateur() && !this.enApercu()) {
      this.emit(this.evenementDeReglage, { reglages: this.valeurs });
    }
  }

  private appliquerPrereglage(rang: number): void {
    const prereglage = this.interne?.prereglages?.[rang];
    if (prereglage === undefined) {
      return;
    }
    this.arreterAnimation();
    for (const parametre of this.interne?.parametres ?? []) {
      if (Object.hasOwn(prereglage.valeurs, parametre.cle)) {
        this.courantes = {
          ...this.courantes,
          [parametre.cle]: borner(parametre, prereglage.valeurs[parametre.cle]),
        };
      }
    }
    this.refresh();
  }

  private regler(cle: string, valeur: number): void {
    const parametre = this.interne?.parametres.find((candidat) => candidat.cle === cle);
    if (parametre === undefined) {
      return;
    }
    this.arreterAnimation();
    this.courantes = { ...this.courantes, [cle]: borner(parametre, valeur) };
    this.apresReglage?.(cle);
    const sortie = this.racine.querySelector<HTMLOutputElement>(
      `output[data-testid="valeur"][data-cle="${cle}"]`,
    );
    if (sortie !== null) {
      sortie.textContent = this.afficherValeur(this.courantes[cle]);
    }
    this.rafraichirLeRendu();
    this.racine
      .querySelectorAll<HTMLButtonElement>('[data-testid="prereglage"]')
      .forEach((bouton) => {
        const prereglage = this.interne?.prereglages?.[Number(bouton.dataset['rang'])];
        bouton.setAttribute('aria-pressed', String(this.estActif(prereglage)));
      });
  }

  private animer(): void {
    const parametres = this.interne?.parametres ?? [];
    if (parametres.length === 0) {
      return;
    }
    this.arreterAnimation();
    const suite = this.interne?.animation ?? suiteVersLeMaximum(parametres, this.courantes);
    this.arretDeLAnimation = jouerSuite(suite, (etape) => {
      this.courantes = poserEtape(parametres, this.courantes, etape);
      this.apresEtape?.(etape);
      this.refresh();
      this.relayerReglages();
    });
  }

  private arreterAnimation(): void {
    this.arretDeLAnimation?.();
    this.arretDeLAnimation = null;
  }
}
