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
 * `html` est injecte dans le DOM : il doit rester du contenu de confiance
 * (statique, fourni par la page appelante), jamais une saisie utilisateur.
 */
export interface AsiliManifestoLine {
  step?: string;
  html: string;
}

/**
 * Fail-open : les lignes sont rendues allumees (`lit`) par defaut, donc
 * lisibles cote serveur, en prerender, en print et si le JS echoue. C'est le
 * browser qui retire `lit` avant de le repiloter a l'IntersectionObserver.
 */
@Component({
  selector: 'app-asili-manifesto',
  standalone: true,
  templateUrl: './asili-manifesto.component.html',
  styleUrls: ['./asili-manifesto.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliManifestoComponent implements AfterViewInit {
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

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

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
