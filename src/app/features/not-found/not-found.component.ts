import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="px-[5%] py-24">
      <div class="container max-w-2xl text-center space-y-6">
        <p class="text-sm font-semibold" i18n="@@notFoundLabel">Erreur 404</p>
        <h1
          class="text-5xl font-bold md:text-6xl"
          i18n="@@notFoundTitle"
          data-testid="not-found-title"
        >
          Page introuvable
        </h1>
        <p i18n="@@notFoundDescription">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div class="flex justify-center gap-4">
          <a
            routerLink="/presentation"
            class="rounded-button bg-black px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            i18n="@@notFoundCta"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
