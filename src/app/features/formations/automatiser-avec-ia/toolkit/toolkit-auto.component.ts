import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ToolkitFormComponent } from "../../../../shared/components/toolkit-form/toolkit-form.component";

/**
 * Page toolkit pour la formation "Automatiser avec l'IA".
 *
 * Capture l'email de l'utilisateur et declenche l'envoi du PDF
 * "5 workflows prets a l'emploi" via le pipeline lead-magnet.
 * Contenu editorial present pour eviter la penalite "thin content".
 */
@Component({
  selector: "app-toolkit-auto",
  standalone: true,
  imports: [RouterModule, ToolkitFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-scheme-background px-4 py-12">
      <div class="mx-auto max-w-2xl">
        <header class="text-center mb-10">
          <h1
            class="font-heading text-h3 text-scheme-text mb-3"
            i18n="@@formations.auto.toolkit.title"
          >
            Recevez vos 5 workflows prêts à l'emploi
          </h1>
          <p
            class="text-base text-scheme-text-muted leading-relaxed"
            i18n="@@formations.auto.toolkit.subtitle"
          >
            Les cinq workflows testés de la formation — avec les prompts exacts,
            les pièges à éviter et la checklist de relecture — livrés en PDF
            dans votre boîte mail en 30 secondes. Gratuit, sans engagement.
          </p>
        </header>

        <section
          class="bg-white rounded-xl border border-scheme-border p-6 shadow-sm mb-10"
        >
          <app-toolkit-form formationSlug="automatiser-avec-ia" />
        </section>

        <section
          class="mb-10 rounded-xl bg-scheme-surface border border-scheme-border p-6"
          aria-labelledby="toolkit-auto-contents-heading"
        >
          <h2
            id="toolkit-auto-contents-heading"
            class="font-heading text-h5 text-scheme-text mb-4"
            i18n="@@formations.auto.toolkit.contentsTitle"
          >
            Ce que contient le toolkit
          </h2>
          <ul
            class="space-y-3 text-sm md:text-base text-scheme-text leading-relaxed list-disc pl-5"
          >
            <li i18n="@@formations.auto.toolkit.content1">
              Les 5 workflows complets avec le prompt exact, le résultat attendu
              et la durée pour le mettre en place — devis, emails, réseaux
              sociaux, factures, veille.
            </li>
            <li i18n="@@formations.auto.toolkit.content2">
              La checklist de relecture en une minute — les 6 points à vérifier
              avant d'envoyer un contenu généré par l'IA à un client ou un
              prospect.
            </li>
            <li i18n="@@formations.auto.toolkit.content3">
              Le tableau de bord "temps gagné" — une feuille Google Docs
              pré-remplie pour mesurer le retour sur investissement de chaque
              workflow sur 4 semaines.
            </li>
            <li i18n="@@formations.auto.toolkit.content4">
              Les alternatives gratuites aux outils payants — pour chaque
              workflow, les options zéro euro qui tiennent la route en 2026 et
              celles à éviter.
            </li>
          </ul>
        </section>

        <section
          class="mb-10 rounded-xl bg-scheme-surface border border-scheme-border p-6"
          aria-labelledby="toolkit-auto-faq-heading"
        >
          <h2
            id="toolkit-auto-faq-heading"
            class="font-heading text-h5 text-scheme-text mb-4"
            i18n="@@formations.auto.toolkit.faqTitle"
          >
            Questions fréquentes
          </h2>
          <div class="space-y-5 text-sm md:text-base">
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.auto.toolkit.faq1Q"
              >
                Les workflows fonctionnent-ils sans outil payant ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.auto.toolkit.faq1A"
              >
                Oui. Les 5 workflows tournent entièrement sur les versions
                gratuites de ChatGPT, Perplexity, Buffer et Google Docs. Le
                toolkit indique quand un outil payant apporte un gain réel et
                quand c'est un achat inutile.
              </p>
            </div>
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.auto.toolkit.faq2Q"
              >
                Faut-il avoir suivi la formation pour utiliser le toolkit ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.auto.toolkit.faq2A"
              >
                Non. Le PDF est autonome — chaque workflow est documenté étape
                par étape avec captures d'écran. La formation ajoute le contexte
                et les explications, le toolkit donne les instructions pratiques
                directement copiables.
              </p>
            </div>
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.auto.toolkit.faq3Q"
              >
                Comment recevoir le toolkit ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.auto.toolkit.faq3A"
              >
                Laissez votre email dans le formulaire. Vous recevrez le PDF
                dans la minute. Aucune newsletter automatique, aucun suivi
                marketing — conforme RGPD.
              </p>
            </div>
          </div>
        </section>

        <p class="text-center text-xs text-scheme-text-muted">
          Asili Design — asilidesign.fr —
          <a routerLink="/fr/privacy" class="underline"
            >Politique de confidentialité</a
          >
        </p>
      </div>
    </div>
  `,
})
export class ToolkitAutoComponent {}
