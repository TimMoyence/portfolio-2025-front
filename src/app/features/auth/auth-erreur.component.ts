import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-erreur',
  standalone: true,
  template: `
    @if (message()) {
      <p class="auth-msg err" role="alert" aria-live="assertive">
        {{ message() }}
      </p>
    }
  `,
  styles: `
    @use './auth-msg';

    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthErreurComponent {
  readonly message = input<string | undefined>();
}
