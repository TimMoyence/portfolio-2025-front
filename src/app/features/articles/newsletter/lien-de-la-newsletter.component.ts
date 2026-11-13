import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { Observable } from 'rxjs';
import { NEWSLETTER_PORT, type NewsletterPort } from '../../../core/ports/newsletter.port';
import { NewsletterFormComponent } from '../../../shared/components/sections/newsletter-form/newsletter-form.component';
import { handleFormSubmit } from '../../../shared/utils/form-submit.utils';
import { jetonDuLien } from '../../auth/reinitialisation/jeton-du-lien';

export type LienDeLaNewsletter = 'confirmation' | 'desabonnement';

interface PageDuLien {
  readonly titre: string;
  readonly bouton: string;
  readonly succes: string;
  readonly refus: string;
  readonly reabonnement: boolean;
  readonly action: (port: NewsletterPort, jeton: string) => Observable<unknown>;
}

const PAGES: Readonly<Record<LienDeLaNewsletter, PageDuLien>> = {
  confirmation: {
    titre: $localize`:@@newsletterConfirmationTitre:Confirmer votre abonnement à la newsletter`,
    bouton: $localize`:@@newsletterConfirmationBouton:Confirmer mon abonnement`,
    succes: $localize`:@@newsletterConfirmationSucces:Votre abonnement est confirmé.`,
    refus: $localize`:@@newsletterConfirmationRefus:Ce lien de confirmation a expiré ou n’est pas valable.`,
    reabonnement: true,
    action: (port, jeton) => port.confirmer(jeton),
  },
  desabonnement: {
    titre: $localize`:@@newsletterDesabonnementTitre:Se désabonner de la newsletter`,
    bouton: $localize`:@@newsletterDesabonnementBouton:Me désabonner`,
    succes: $localize`:@@newsletterDesabonnementSucces:Vous êtes désabonné.`,
    refus: $localize`:@@newsletterDesabonnementRefus:Ce lien de désabonnement n’est pas valable.`,
    reabonnement: false,
    action: (port, jeton) => port.seDesabonner(jeton),
  },
};

type EtatDuLien = 'attente' | 'envoi' | 'fait' | 'refuse' | 'panne';

const LIEN_EXPIRE_OU_FAUX = 404;

@Component({
  selector: 'app-lien-de-la-newsletter',
  standalone: true,
  imports: [NewsletterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap lien-de-la-newsletter">
      <h1>{{ page.titre }}</h1>
      @switch (etat()) {
        @case ('fait') {
          <p role="status">{{ page.succes }}</p>
        }
        @case ('refuse') {
          <p role="alert">{{ erreur() }}</p>
          @if (page.reabonnement) {
            <h2 i18n="@@newsletterLienSeReabonner">Se réabonner</h2>
            <app-newsletter-form />
          }
        }
        @default {
          @if (jeton === null) {
            <p role="alert" i18n="@@newsletterLienIncomplet">
              Ce lien est incomplet : ouvrez-le depuis l’email reçu.
            </p>
          } @else {
            @if (etat() === 'panne') {
              <p role="alert">{{ erreur() }}</p>
            }
            <button
              type="button"
              class="rounded-full bg-scheme-accent px-6 py-3 text-sm font-semibold text-scheme-on-accent disabled:opacity-50"
              [disabled]="etat() === 'envoi'"
              (click)="agir()"
            >
              {{ page.bouton }}
            </button>
          }
        }
      }
    </section>
  `,
  styles: `
    .lien-de-la-newsletter {
      display: grid;
      gap: var(--s-4);
      justify-items: start;
      padding-block: var(--s-8);
    }
  `,
})
export class LienDeLaNewsletterComponent {
  private readonly port = inject(NEWSLETTER_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  protected readonly page = PAGES[this.route.snapshot.data['lien'] as LienDeLaNewsletter];
  protected readonly jeton = jetonDuLien(this.route);
  protected readonly etat = signal<EtatDuLien>('attente');
  protected readonly erreur = signal('');

  protected agir(): void {
    if (this.jeton === null) return;
    this.etat.set('envoi');
    handleFormSubmit(this.page.action(this.port, this.jeton), this.cdr, {
      refus: { [LIEN_EXPIRE_OU_FAUX]: this.page.refus },
      fallbackError: $localize`:@@newsletterLienIndisponible:Le lien n’a pas pu être pris en compte pour le moment : réessayez dans un instant.`,
      onSuccess: () => this.etat.set('fait'),
      onError: (message, statut) => {
        this.erreur.set(message);
        this.etat.set(statut === LIEN_EXPIRE_OU_FAUX ? 'refuse' : 'panne');
      },
    });
  }
}
