import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-success',
  standalone: true,
  templateUrl: './auth-success.component.html',
  styleUrl: './auth-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSuccessComponent {
  readonly message = input<string>();
}
