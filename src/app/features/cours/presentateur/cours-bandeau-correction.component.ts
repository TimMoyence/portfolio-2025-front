import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { CorrectionAffichee } from './corrections-affichees';

@Component({
  selector: 'app-cours-bandeau-correction',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (revele() && corrections().length > 0) {
      <aside class="cours-correction" data-testid="cours-correction" aria-live="polite">
        <p class="cours-correction__titre" i18n="@@coursCorrectionTitre">Correction</p>
        <dl class="cours-correction__liste">
          @for (ligne of corrections(); track $index) {
            <div class="cours-correction__ligne">
              <dt>{{ ligne.enonce }}</dt>
              <dd>{{ ligne.bonneReponse }}</dd>
            </div>
          }
        </dl>
      </aside>
    }
  `,
  styles: `
    .cours-correction {
      position: absolute;
      inset-inline: 1.5rem;
      inset-block-end: 1.5rem;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.5rem;
      max-block-size: 60%;
      box-sizing: border-box;
      padding: 1rem 1.25rem;
      border-inline-start: 0.375rem solid var(--success, #2f7d4f);
      border-radius: 0.75rem;
      background: var(--ivory, #fbf3e6);
      box-shadow: 0 0.5rem 1.5rem rgba(12, 9, 2, 0.18);
    }

    .cours-correction__titre {
      margin: 0;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .cours-correction__liste {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      gap: 0.35rem 1.5rem;
      margin: 0;
    }

    .cours-correction__ligne {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      align-items: baseline;
    }

    .cours-correction__ligne dt {
      font-size: 1rem;
    }

    .cours-correction__ligne dd {
      margin: 0;
      font-weight: 700;
      font-size: 1.25rem;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  `,
})
export class CoursBandeauCorrectionComponent {
  readonly corrections = input.required<readonly CorrectionAffichee[]>();
  readonly revele = input.required<boolean>();
}
