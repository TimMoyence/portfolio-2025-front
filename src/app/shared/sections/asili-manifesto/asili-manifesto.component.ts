import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';

/**
 * Une ligne du manifeste (scrollytelling).
 *
 * - `step` : court intitule mono teal affiche au-dessus de la ligne
 *   (ex. `"Le probleme"`). Optionnel.
 * - `html` : contenu de la ligne. Peut contenir un accent teal italique via
 *   `<span class="t">...</span>`. Fourni par la page appelante (texte de
 *   confiance, statique) et assaini par Angular avant injection.
 */
export interface AsiliManifestoLine {
  step?: string;
  html: string;
}

/**
 * Section « Manifeste » Asili : suite de lignes serif geantes en
 * scrollytelling. Au repos chaque ligne est attenuee (`--ink-faint`) ; elle
 * s'allume (`.lit`, `--ink`) lorsqu'elle traverse le centre vertical de
 * l'ecran. Portee de `.manifesto` / `.mani-line` / `.mani-step` de la maquette
 * `AsiliNewDesign/asili-sections.css`.
 *
 * Composant de presentation pur : tout le texte arrive via l'input `lines`
 * (l'i18n est delegue aux pages appelantes). Standalone, OnPush.
 *
 * SSR / fail-open : les lignes sont rendues allumees (`lit`) par defaut, donc
 * pleinement lisibles cote serveur, en prerender, en print et si le JS echoue.
 * Cote browser uniquement, le composant retire `lit` puis l'applique
 * dynamiquement via un `IntersectionObserver` centre sur le milieu de l'ecran
 * (bande etroite reproduisant le seuil `mid = 52%` de la maquette). Aucun
 * acces a `window`/`document` au rendu serveur.
 *
 * Niveaux de titre : le manifeste est purement textuel (`<p>`) et n'introduit
 * pas de titre — il s'insere entre deux sections sans rompre la hierarchie.
 */
@Component({
  selector: 'app-asili-manifesto',
  standalone: true,
  templateUrl: './asili-manifesto.component.html',
  styleUrls: ['./asili-manifesto.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliManifestoComponent implements AfterViewInit {
  /** Lignes du manifeste a afficher dans l'ordre. */
  readonly lines = input.required<readonly AsiliManifestoLine[]>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const elements = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('.mani-line'),
    );
    if (elements.length === 0) {
      return;
    }

    // Sans IntersectionObserver, on garde les lignes allumees (fail-open).
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Bascule en mode anime : tout est attenue, l'observer rallumera au scroll.
    for (const el of elements) {
      el.classList.remove('lit');
    }

    // Bande etroite (~4%) centree sur le milieu vertical de la fenetre : une
    // ligne est « lit » quand elle la traverse, comme `mid = 52%` de la maquette.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('lit', entry.isIntersecting);
        }
      },
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 },
    );
    for (const el of elements) {
      observer.observe(el);
    }
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
