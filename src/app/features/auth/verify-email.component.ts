import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AUTH_PORT, type AuthPort } from '../../core/ports/auth.port';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { AuthShellComponent } from '../../shared/components/auth-shell/auth-shell.component';
import { AuthSuccessComponent } from '../../shared/components/auth-success/auth-success.component';
import { extractErrorMessage } from '../../shared/utils/http-error.utils';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RevealOnScrollDirective,
    AuthShellComponent,
    AuthSuccessComponent,
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService: AuthPort = inject(AUTH_PORT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  successMessage?: string;
  errorMessage?: string;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;
      this.errorMessage = $localize`:verify-email.error.noToken@@verifyEmailErrorNoToken:Aucun token de verification fourni.`;
      this.cdr.markForCheck();
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.successMessage = result.message;
        this.cdr.markForCheck();
        setTimeout(() => {
          void this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          extractErrorMessage(err, { includeTopLevelMessage: false }) ??
          $localize`:verify-email.error.generic@@verifyEmailErrorGeneric:La verification a echoue. Le lien est peut-etre expire.`;
        this.cdr.markForCheck();
      },
    });
  }
}
