import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthShellComponent } from '../../shared/components/auth/auth-shell/auth-shell.component';
import { AuthSuccessComponent } from '../../shared/components/auth/auth-success/auth-success.component';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { IllustrationAuthComponent } from './connexion/illustration-auth.component';

export const IMPORTS_PAGE_AUTH = [
  CommonModule,
  RouterModule,
  RevealOnScrollDirective,
  AuthShellComponent,
  AuthSuccessComponent,
  IllustrationAuthComponent,
] as const;
