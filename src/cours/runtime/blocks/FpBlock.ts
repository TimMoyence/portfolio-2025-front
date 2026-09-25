import type { Role } from '../../content/types';
import { adoptCoursStyles } from '../design/sheet';
import { texte as traduire } from '../core/i18n';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';
import type { DetailDeVerdict, VerdictDeProduction, VerdictDeReponse } from './retours';

const VIDE = escapeHtml('');
const DESACTIVE = safeHtml`disabled`;
const ATTRIBUTS_DE_REPERE: readonly string[] = [
  'data-testid',
  'data-nom',
  'data-cle',
  'data-rang',
  'data-etape',
  'data-carte',
  'data-option',
  'data-enigme',
  'data-etat-pulse',
];

interface Foyer {
  readonly selecteur: string;
  readonly debut: number | null;
  readonly fin: number | null;
}

function echapperAttribut(valeur: string): string {
  return valeur.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

const TYPES_SELECTIONNABLES: ReadonlySet<string> = new Set([
  'text',
  'search',
  'url',
  'tel',
  'password',
]);

function selectionnable(element: Element): element is HTMLInputElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLInputElement && TYPES_SELECTIONNABLES.has(element.type))
  );
}

function positionDeSaisie(element: HTMLElement): { debut: number | null; fin: number | null } {
  return selectionnable(element)
    ? { debut: element.selectionStart, fin: element.selectionEnd }
    : { debut: null, fin: null };
}

export abstract class FpBlock extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['data-cours-role', 'data-apercu', 'etat'];
  }

  protected readonly racine: ShadowRoot;

  private idAffiche: string | null = null;
  private affiche = 0;
  private interneDejaRepondu = false;
  private interneCloture = false;
  private interneErreur: string | null = null;
  private brouillonRepris = false;

  constructor() {
    super();
    this.racine = this.attachShadow({ mode: 'open' });
  }

  abstract render(): EscapedHtml;
  abstract bind(racine: ShadowRoot): void;

  set dejaRepondu(valeur: boolean) {
    this.interneDejaRepondu = valeur === true;
    this.refreshSiConnecte();
  }

  get dejaRepondu(): boolean {
    return this.interneDejaRepondu;
  }

  set cloture(valeur: boolean) {
    this.interneCloture = valeur === true;
    this.refreshSiConnecte();
  }

  get cloture(): boolean {
    return this.interneCloture && !this.enApercu();
  }

  set erreur(valeur: string | null) {
    this.appliquerErreur(valeur);
  }

  get erreur(): string | null {
    return this.interneErreur;
  }

  protected appliquerErreur(valeur: string | null): void {
    this.interneErreur = typeof valeur === 'string' && valeur.length > 0 ? valeur : null;
    this.refreshSiConnecte();
  }

  connectedCallback(): void {
    try {
      adoptCoursStyles(this.racine);
      this.refresh();
    } catch (erreur) {
      this.signalerErreur(erreur);
    }
  }

  attributeChangedCallback(): void {
    try {
      this.refreshSiConnecte();
    } catch (erreur) {
      this.signalerErreur(erreur);
    }
  }

  protected refreshSiConnecte(): void {
    if (this.isConnected) {
      try {
        this.refresh();
      } catch (erreur) {
        this.signalerErreur(erreur);
      }
    }
  }

  roleActuel(): Role {
    return this.getAttribute('data-cours-role') === 'presentateur' ? 'presentateur' : 'etudiant';
  }

  presentateur(): boolean {
    return this.roleActuel() === 'presentateur';
  }

  enApercu(): boolean {
    return this.hasAttribute('data-apercu');
  }

  texte(cle: string): string {
    return traduire(cle);
  }

  emit(nom: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(nom, { detail, bubbles: true, composed: true }));
  }

  suivreAffichage(id: string | null): void {
    if (id !== this.idAffiche) {
      this.idAffiche = id;
      this.affiche = Date.now();
    }
  }

  protected suivreEtSaisir(id: string | null): boolean {
    this.suivreAffichage(id);
    return !this.presentateur();
  }

  depuisAffichage(): number {
    return Date.now() - this.affiche;
  }

  refresh(): void {
    const foyer = this.reperer(this.racine.activeElement);
    this.racine.innerHTML = safeHtml`<div class="fp-root" data-role="${escapeHtml(this.roleActuel())}">${this.render()}</div>`;
    this.bind(this.racine);
    if (foyer !== null && this.racine.activeElement === null) {
      this.restaurer(foyer);
    }
  }

  protected rafraichirZone(zone: string, contenu: EscapedHtml): void {
    const cible = this.racine.querySelector<HTMLElement>(`[data-zone="${zone}"]`);
    if (cible === null) {
      this.refresh();
      return;
    }
    cible.innerHTML = contenu;
  }

  protected verrouilleApresEnvoi(envoye: boolean, verdictRecu: boolean): boolean {
    if (this.enApercu()) {
      return false;
    }
    return (
      (envoye && this.interneErreur === null) ||
      verdictRecu ||
      this.interneDejaRepondu ||
      this.interneCloture
    );
  }

  protected messageApresEnvoi(): string {
    return this.texte(this.enApercu() ? 'apercu' : 'reponse-enregistree');
  }

  protected signalerBrouillon(id: string, valeur: unknown): void {
    if (!this.enApercu() && !this.presentateur()) {
      this.emit('fp-brouillon', { id, valeur });
    }
  }

  protected noterBrouillonRepris(): void {
    this.brouillonRepris = true;
  }

  protected attente(): EscapedHtml {
    return safeHtml`<p data-testid="attente">${escapeHtml(this.texte('chargement'))}</p>`;
  }

  protected annonces(): EscapedHtml {
    const erreur =
      this.interneErreur === null
        ? VIDE
        : safeHtml`<p class="fp-alerte" role="alert" data-testid="erreur">${escapeHtml(this.interneErreur)}</p>`;
    const deja = this.interneDejaRepondu
      ? safeHtml`<p class="fp-annonce" role="status" data-testid="deja-repondu">${escapeHtml(this.texte('deja-repondu'))}</p>`
      : VIDE;
    const brouillon =
      this.brouillonRepris && !this.interneDejaRepondu
        ? safeHtml`<p class="fp-annonce" role="status" data-testid="brouillon-restaure">${escapeHtml(this.texte('brouillon-restaure'))}</p>`
        : VIDE;
    const close =
      this.interneCloture && !this.enApercu()
        ? safeHtml`<p class="fp-annonce" role="status" data-testid="reponses-closes">${escapeHtml(this.texte('reponses-closes'))}</p>`
        : VIDE;
    return safeHtml`${erreur}${deja}${brouillon}${close}`;
  }

  protected etatDuDetail(detail: DetailDeVerdict): EscapedHtml {
    const etat = detail.juste ? 'confirme' : 'a-revoir';
    return safeHtml`data-etat="${escapeHtml(etat)}" title="${escapeHtml(detail.libelleConfusion ?? '')}"`;
  }

  protected verdictDeReponse(verdict: VerdictDeReponse | null): EscapedHtml {
    if (verdict === null) {
      return VIDE;
    }
    const confusion =
      verdict.correcte || verdict.libelleConfusion === null
        ? VIDE
        : safeHtml` <span class="fp-verdict__confusion" data-testid="confusion">${escapeHtml(verdict.libelleConfusion)}</span>`;
    return safeHtml`<p class="fp-verdict" role="status" data-testid="verdict" data-etat="${escapeHtml(verdict.correcte ? 'confirme' : 'a-revoir')}"><strong>${escapeHtml(this.texte(verdict.correcte ? 'verdict-juste' : 'verdict-a-revoir'))}</strong>${confusion}</p>`;
  }

  protected verdictDeProduction(
    verdict: VerdictDeProduction | null,
    cleDuDecompte: string,
    justes: number,
    total: number,
  ): EscapedHtml {
    if (verdict === null) {
      return VIDE;
    }
    const pourcentage = Math.round(verdict.score * 100);
    return safeHtml`<p class="fp-verdict" role="status" data-testid="verdict" data-etat="${escapeHtml(verdict.correcte ? 'confirme' : 'a-revoir')}"><strong>${escapeHtml(this.texte(verdict.correcte ? 'verdict-juste' : 'verdict-a-revoir'))}</strong> <span data-testid="decompte">${escapeHtml(this.texte(cleDuDecompte))} ${justes}/${total}</span> <span data-testid="score">${escapeHtml(this.texte('verdict-score'))} ${pourcentage} %</span></p>`;
  }

  protected boutonNeSaitPas(desactive: boolean): EscapedHtml {
    return safeHtml`<button type="button" class="fp-bouton-neutre" data-testid="je-ne-sais-pas" ${desactive ? DESACTIVE : VIDE}>${escapeHtml(this.texte('je-ne-sais-pas'))}</button>`;
  }

  private signalerErreur(erreur: unknown): void {
    this.dispatchEvent(
      new CustomEvent('fp-block-error', {
        detail: erreur,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private reperer(element: Element | null): Foyer | null {
    if (!(element instanceof HTMLElement)) {
      return null;
    }
    const attributs = ATTRIBUTS_DE_REPERE.filter((nom) => element.hasAttribute(nom)).map(
      (nom) => `[${nom}="${echapperAttribut(element.getAttribute(nom) ?? '')}"]`,
    );
    if (attributs.length === 0) {
      return null;
    }
    const { debut, fin } = positionDeSaisie(element);
    return { selecteur: `${element.localName}${attributs.join('')}`, debut, fin };
  }

  private restaurer(foyer: Foyer): void {
    const cible = this.racine.querySelector<HTMLElement>(foyer.selecteur);
    if (cible === null || cible.hasAttribute('disabled')) {
      return;
    }
    cible.focus({ preventScroll: true });
    if (selectionnable(cible) && foyer.debut !== null && foyer.fin !== null) {
      cible.setSelectionRange(foyer.debut, foyer.fin);
    }
  }
}
