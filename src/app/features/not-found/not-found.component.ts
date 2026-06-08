import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";

/**
 * Page 404 ludique — restyle Asili.
 *
 * Portée de `AsiliNewDesign/404.html` + `asili-legal.css`
 * (`.nf-body`, `.nf-inner`, `.nf-kicker`, `.nf-code`, `.nf-cta`, `.nf-hint`).
 *
 * Le « 0 » qui suit le curseur est un bonus purement décoratif, activé
 * uniquement en environnement browser (`isPlatformBrowser`) et respectant
 * `prefers-reduced-motion` ; en SSR/prerender ou sans JS, le « 0 » reste centré
 * (dégradation gracieuse). Conserve `seoKey:'not-found'` et le catch-all `**`
 * (définis dans `app.routes.ts`, non modifiés ici).
 */
@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="nf-body">
      <div class="nf-inner">
        <span class="nf-kicker" i18n="@@notFoundLabel">Erreur 404</span>
        <div class="nf-code" aria-label="404">
          4<span #zero class="o" aria-hidden="true">0</span>4
        </div>
        <!--
          La GIF est conservée (demande utilisateur) en visuel décoratif sous le
          code « 4 0 4 ». Asset existant /assets/images/404.gif, SSR-safe (image
          statique, aucun JS requis pour l'afficher), alt descriptif.
        -->
        <img
          class="nf-gif"
          src="/assets/images/404.gif"
          alt="Illustration animée d'une page égarée"
          i18n-alt="notFound.imageAlt|Image d'erreur 404@@notFoundImageAlt"
          loading="lazy"
          decoding="async"
        />
        <h1 i18n="@@notFoundTitle" data-testid="not-found-title">
          Cette page a quitté <em>l'atelier</em>.
        </h1>
        <p i18n="@@notFoundDescription">
          La page que vous cherchez a peut-être été déplacée, ou n'a jamais
          existé. Mais l'expérimentation, elle, continue.
        </p>
        <div class="nf-cta">
          <a class="btn btn-teal" routerLink="/" i18n="@@notFoundCta">
            Retour à l'accueil <span class="arrow">→</span>
          </a>
          <a
            class="btn btn-ghost"
            routerLink="/atelier"
            i18n="@@notFoundCtaAtelier"
          >
            Explorer l'Atelier
          </a>
        </div>
        <div class="nf-hint" i18n="@@notFoundHint">
          Astuce : le « 0 » aime suivre votre curseur. Survolez-le.
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      /* Portés verbatim de AsiliNewDesign/asili-legal.css (.nf-*). */
      :host {
        display: block;
      }
      .nf-body {
        min-height: 70vh;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 100px 24px 60px;
      }
      .nf-inner {
        position: relative;
        z-index: 2;
        max-width: 600px;
      }
      .nf-kicker {
        font-family: var(--font-mono);
        font-size: 12px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--teal-deep);
      }
      .nf-code {
        font-family: var(--font-display);
        font-size: clamp(120px, 22vw, 260px);
        line-height: 0.9;
        color: var(--ink);
        letter-spacing: -0.04em;
        user-select: none;
      }
      .nf-code .o {
        display: inline-block;
        color: var(--teal-deep);
        cursor: grab;
        transition: transform 0.2s var(--ease);
      }
      .nf-code .o:active {
        cursor: grabbing;
      }
      /* GIF décorative (conservée à la demande de l'utilisateur). Intégrée au
         style Asili : largeur contenue, coins arrondis, ombre douce. */
      .nf-gif {
        display: block;
        width: clamp(180px, 40vw, 280px);
        height: auto;
        margin: 4px auto 8px;
        border-radius: var(--r-lg);
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.1);
      }
      .nf-inner h1 {
        font-family: var(--font-display);
        font-size: clamp(28px, 3.4vw, 42px);
        margin: 18px 0 14px;
      }
      .nf-inner h1 em {
        font-style: italic;
        color: var(--teal-deep);
      }
      .nf-inner p {
        font-size: 17px;
        color: var(--ink-soft);
        max-width: 44ch;
        margin: 0 auto 30px;
      }
      .nf-cta {
        display: flex;
        gap: 13px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .nf-hint {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-faint);
        margin-top: 30px;
      }
      @media (prefers-reduced-motion: reduce) {
        .nf-code .o {
          transition: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** Le « 0 » du code 404, cible de l'effet de suivi du curseur. */
  private readonly zero = viewChild<ElementRef<HTMLElement>>("zero");

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Respecte prefers-reduced-motion : pas d'effet si l'utilisateur le demande.
    const prefersReduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      return;
    }
    this.enableCursorFollow();
  }

  /**
   * Active le suivi léger du curseur par le « 0 » (effet décoratif, browser only).
   * S'auto-nettoie via DestroyRef.
   */
  private enableCursorFollow(): void {
    const onMove = (event: PointerEvent): void => {
      const el = this.zero()?.nativeElement;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (event.clientX - cx) / 14;
      const dy = (event.clientY - cy) / 14;
      const max = 16;
      const clampedX = Math.max(-max, Math.min(max, dx));
      const clampedY = Math.max(-max, Math.min(max, dy));
      el.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    };
    const onLeave = (): void => {
      const el = this.zero()?.nativeElement;
      if (el) {
        el.style.transform = "";
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    });
  }
}
