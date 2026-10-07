import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ImagePrioritaireDirective } from '../image-prioritaire.directive';

@Component({
  selector: 'app-slide-illustration',
  standalone: true,
  imports: [ImagePrioritaireDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-illustration.component.html',
  styleUrl: './slide-illustration.component.scss',
})
export class SlideIllustrationComponent {
  readonly image = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly priority = input(false);
}
