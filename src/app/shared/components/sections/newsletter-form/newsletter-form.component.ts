import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  injecterLocaleDeLaPage,
  type LocaleDuSite,
} from '../../../../core/config/locale-de-la-page';
import { VERSIONS_DES_TEXTES_LEGAUX } from '../../../../core/config/textes-legaux';
import { NEWSLETTER_PORT } from '../../../../core/ports/newsletter.port';
import { HoneypotDirective } from '../../../directives/honeypot.directive';
import { erreurDeFormat } from '../../../directives/format-de-contact.directive';
import { readCheckboxChecked, readInputValue } from '../../../utils/dom-event.utils';
import { handleFormSubmit, INFORMATIONS_REFUSEES } from '../../../utils/form-submit.utils';
import { saisieAntiRobot } from '../../../utils/saisie/saisie-anti-robot';

type EtatDuFormulaire = 'saisie' | 'envoi' | 'succes' | 'erreur';

let blocsDeLaPage = 0;

function prochainIdDuTitre(): string {
  blocsDeLaPage += 1;
  return `newsletter-titre-${blocsDeLaPage}`;
}

@Component({
  selector: 'app-newsletter-form',
  standalone: true,
  imports: [HoneypotDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3" [attr.aria-labelledby]="idDuTitre">
      <h2 [id]="idDuTitre" class="text-base font-semibold" i18n="@@newsletterFormTitre">
        Newsletter
      </h2>
      @if (etat() === 'succes') {
        <p role="status" data-newsletter-succes class="text-sm">{{ messageServi() }}</p>
      } @else {
        <form (submit)="$event.preventDefault(); sAbonner()" class="space-y-3">
          <input
            appHoneypot
            name="website"
            [value]="website()"
            (input)="website.set(readInputValue($event))"
          />
          <label class="block text-sm">
            <span i18n="@@newsletterFormEmail">Votre email</span>
            <input
              type="email"
              name="email"
              autocomplete="email"
              required
              [value]="email()"
              (input)="email.set(readInputValue($event))"
              class="mt-1 w-full rounded-lg border border-scheme-border px-3 py-2 text-sm text-scheme-text"
            />
          </label>
          <fieldset class="flex gap-4 text-sm">
            <legend class="sr-only" i18n="@@newsletterFormLangue">Langue de la newsletter</legend>
            <label class="flex items-center gap-1">
              <input
                type="radio"
                name="langue"
                value="en"
                [checked]="langue() === 'en'"
                (change)="langue.set('en')"
              />
              English
            </label>
            <label class="flex items-center gap-1">
              <input
                type="radio"
                name="langue"
                value="fr"
                [checked]="langue() === 'fr'"
                (change)="langue.set('fr')"
              />
              Français
            </label>
          </fieldset>
          <label class="flex items-start gap-2 text-xs text-scheme-text-muted">
            <input
              type="checkbox"
              data-newsletter-consentement
              [checked]="consentement()"
              (change)="consentement.set(readCheckboxChecked($event))"
            />
            <span i18n="@@newsletterFormConsentement"
              >J’accepte de recevoir la newsletter selon la
              <a routerLink="/privacy" class="underline">politique de confidentialité</a>.</span
            >
          </label>
          @if (etat() === 'erreur') {
            <p role="alert" data-newsletter-erreur class="text-sm text-red-600">{{ erreur() }}</p>
          }
          <button
            type="submit"
            [disabled]="!valide() || etat() === 'envoi'"
            class="rounded-full bg-scheme-accent px-5 py-2 text-sm font-semibold text-scheme-on-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (etat() === 'envoi') {
              <span i18n="@@newsletterFormEnvoi">Envoi en cours…</span>
            } @else {
              <span i18n="@@newsletterFormSAbonner">S’abonner</span>
            }
          </button>
        </form>
      }
    </section>
  `,
})
export class NewsletterFormComponent {
  private readonly port = inject(NEWSLETTER_PORT);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly antiRobot = saisieAntiRobot();

  readonly email = signal('');
  readonly website = this.antiRobot.website;
  readonly langue = signal<LocaleDuSite>(injecterLocaleDeLaPage());
  readonly consentement = signal(false);
  protected readonly etat = signal<EtatDuFormulaire>('saisie');
  protected readonly erreur = signal('');
  protected readonly messageServi = signal('');
  protected readonly idDuTitre = prochainIdDuTitre();

  protected readonly valide = computed(
    () =>
      this.email().trim().length > 0 &&
      erreurDeFormat(this.email().trim(), 'email') === null &&
      this.consentement(),
  );

  protected readonly readInputValue = readInputValue;
  protected readonly readCheckboxChecked = readCheckboxChecked;

  sAbonner(): void {
    if (!this.valide()) return;
    this.etat.set('envoi');
    handleFormSubmit(
      this.port.sAbonner({
        ...this.antiRobot.champs(),
        email: this.email().trim(),
        locale: this.langue(),
        termsVersion: VERSIONS_DES_TEXTES_LEGAUX.confidentialite,
      }),
      this.cdr,
      {
        fallbackError: $localize`:@@newsletterFormErreur:L’abonnement n’a pas pu partir. Réessayez dans un instant.`,
        refus: { 400: INFORMATIONS_REFUSEES },
        onSuccess: ({ message }) => {
          this.messageServi.set(message);
          this.etat.set('succes');
        },
        onError: (message) => {
          this.erreur.set(message);
          this.etat.set('erreur');
        },
      },
    );
  }
}
