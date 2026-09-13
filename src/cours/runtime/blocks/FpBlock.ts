import type { RenderMode, Role } from '../../content/types';
import { adoptCoursStyles } from '../design/sheet';
import { texte as traduire } from '../core/i18n';
import { type EscapedHtml, escapeHtml, safeHtml } from '../core/html';

export abstract class FpBlock extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['render', 'role', 'seed', 'etat'];
  }

  protected readonly racine: ShadowRoot;

  private idAffiche: string | null = null;
  private affiche = 0;

  constructor() {
    super();
    this.racine = this.attachShadow({ mode: 'open' });
  }

  abstract renderStage(): EscapedHtml;
  abstract renderHand(): EscapedHtml;
  abstract renderBoard(): EscapedHtml;
  abstract bind(racine: ShadowRoot): void;

  connectedCallback(): void {
    adoptCoursStyles(this.racine);
    this.refresh();
  }

  attributeChangedCallback(): void {
    this.refreshSiConnecte();
  }

  protected refreshSiConnecte(): void {
    if (this.isConnected) {
      this.refresh();
    }
  }

  mode(): RenderMode {
    const brut = this.getAttribute('render');
    return brut === 'stage' || brut === 'board' ? brut : 'hand';
  }

  roleActuel(): Role {
    const brut = this.getAttribute('role');
    return brut === 'presentateur' || brut === 'revision' ? brut : 'etudiant';
  }

  seed(): number {
    const brut = Number.parseInt(this.getAttribute('seed') ?? '', 10);
    return Number.isFinite(brut) ? brut : 0;
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

  depuisAffichage(): number {
    return Date.now() - this.affiche;
  }

  refresh(): void {
    const mode = this.mode();
    this.racine.innerHTML = safeHtml`<div class="fp-root" data-render="${escapeHtml(mode)}">${this.corps(mode)}</div>`;
    this.bind(this.racine);
  }

  private corps(mode: RenderMode): EscapedHtml {
    if (mode === 'stage') {
      return this.renderStage();
    }
    if (mode === 'board') {
      return this.renderBoard();
    }
    return this.renderHand();
  }
}
