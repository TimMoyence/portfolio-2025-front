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

export interface AsiliManifestoLine {
  step?: string;
  html: string;
}

const MID_VIEWPORT_BAND: IntersectionObserverInit = {
  rootMargin: '-48% 0px -48% 0px',
  threshold: 0,
};

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
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const lines = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.mani-line'));
    if (lines.length === 0) {
      return;
    }

    this.replaceServerRenderedLitByScrollPiloting(lines);
  }

  private replaceServerRenderedLitByScrollPiloting(lines: readonly HTMLElement[]): void {
    for (const line of lines) {
      line.classList.remove('lit');
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('lit', entry.isIntersecting);
      }
    }, MID_VIEWPORT_BAND);
    for (const line of lines) {
      observer.observe(line);
    }
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
