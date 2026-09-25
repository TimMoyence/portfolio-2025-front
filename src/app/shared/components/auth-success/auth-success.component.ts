import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PictoComponent } from '../picto/picto.component';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  imports: [PictoComponent, RouterLink],
  templateUrl: './auth-success.component.html',
  styleUrl: './auth-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSuccessComponent {
  readonly message = input<string>();
  readonly libelleConnexion = input<string>();
}
