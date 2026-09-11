import type { RenderMode, Role } from '../../content/types';
import { adoptCoursStyles } from '../design/sheet';
import { texte as traduire } from '../core/i18n';

export abstract class FpBlock extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['render', 'role', 'seed', 'etat'];
  }

  protected readonly racine: ShadowRoot;

  constructor() {
    super();
    this.racine = this.attachShadow({ mode: 'open' });
  }

  abstract renderStage(): string;
  abstract renderHand(): string;
  abstract renderBoard(): string;
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

  refresh(): void {
    const mode = this.mode();
    this.racine.innerHTML = `<div class="fp-root" data-render="${mode}">${this.corps(mode)}</div>`;
    this.bind(this.racine);
  }

  private corps(mode: RenderMode): string {
    if (mode === 'stage') {
      return this.renderStage();
    }
    if (mode === 'board') {
      return this.renderBoard();
    }
    return this.renderHand();
  }
}
