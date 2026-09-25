import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PictoComponent, type NomDePicto } from '../../shared/components/picto/picto.component';

@Component({
  selector: 'div[appIllustrationAuth]',
  standalone: true,
  imports: [PictoComponent],
  template: `<svg [appPicto]="appIllustrationAuth()"></svg>`,
  host: { class: 'auth-illus', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IllustrationAuthComponent {
  readonly appIllustrationAuth = input.required<NomDePicto>();
}
