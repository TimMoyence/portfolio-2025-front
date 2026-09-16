import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type CoursSlideFrameVariant = 'student' | 'presenter' | 'projection';

@Component({
  selector: 'app-cours-slide-frame',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="cours-slide-frame" [attr.data-variant]="variant()">
      <header class="cours-slide-frame__header">
        <div class="cours-slide-frame__identity">
          <span class="cours-slide-frame__eyebrow">{{ eyebrow() }}</span>
          @if (title(); as titre) {
            <h2>{{ titre }}</h2>
          }
        </div>
        <div class="cours-slide-frame__meta">
          @if (duration(); as duree) {
            <span>{{ duree }} min</span>
          }
          @if (index() !== null && total() !== null) {
            <span class="cours-slide-frame__counter">{{ index() }} / {{ total() }}</span>
          }
        </div>
      </header>
      <div class="cours-slide-frame__progress" aria-hidden="true">
        <span [style.width.%]="progression()"></span>
      </div>
      <div class="cours-slide-frame__content">
        <ng-content />
      </div>
    </article>
  `,
})
export class CoursSlideFrameComponent {
  readonly variant = input<CoursSlideFrameVariant>('student');
  readonly eyebrow = input('Écran de cours');
  readonly title = input('');
  readonly duration = input<number | null>(null);
  readonly index = input<number | null>(null);
  readonly total = input<number | null>(null);

  protected progression(): number {
    const index = this.index();
    const total = this.total();
    if (index === null || total === null || total <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (index / total) * 100));
  }
}
