import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { PressePapiersService } from '../../../../services/presse-papiers.service';

@Component({
  selector: 'app-slide-prompt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PressePapiersService],
  templateUrl: './slide-prompt.component.html',
  styleUrl: './slide-prompt.component.scss',
})
export class SlidePromptComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly prompt = input.required<string>();

  protected readonly pressePapiers = inject(PressePapiersService);

  protected readonly libelles = {
    repos: $localize`:@@slidePromptCopier:Copier le prompt`,
    copie: $localize`:@@slidePromptCopie:Prompt copié`,
  };
}
