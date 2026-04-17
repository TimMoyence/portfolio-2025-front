import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ToolkitFormComponent } from "../../../../shared/components/toolkit-form/toolkit-form.component";

/**
 * Page standalone pour la capture d'email via QR code.
 * Enrichie P1.9 : contenu éditorial (qu'est-ce, ce qui est inclus, FAQ)
 * pour lever la pénalité "thin content" détectée par Google.
 */
@Component({
  selector: "app-toolkit",
  standalone: true,
  imports: [RouterModule, ToolkitFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-scheme-background px-4 py-12">
      <div class="mx-auto max-w-2xl">
        <header class="text-center mb-10">
          <h1
            class="font-heading text-h3 text-scheme-text mb-3"
            i18n="@@formations.toolkit.title"
          >
            Recevez votre boite a outils IA
          </h1>
          <p
            class="text-base text-scheme-text-muted leading-relaxed"
            i18n="@@formations.toolkit.subtitle"
          >
            Les meilleurs outils IA pour solopreneurs — triés, testés, avec
            prix, budgets mensuels estimés et cas d'usage concrets. Livré dans
            votre boite mail en 30 secondes, gratuit et sans engagement.
          </p>
        </header>

        <section
          class="bg-white rounded-xl border border-scheme-border p-6 shadow-sm mb-10"
        >
          <app-toolkit-form />
        </section>

        <section
          class="mb-10 rounded-xl bg-scheme-surface border border-scheme-border p-6"
          aria-labelledby="toolkit-contents-heading"
        >
          <h2
            id="toolkit-contents-heading"
            class="font-heading text-h5 text-scheme-text mb-4"
            i18n="@@formations.toolkit.contentsTitle"
          >
            Ce que contient le toolkit
          </h2>
          <ul
            class="space-y-3 text-sm md:text-base text-scheme-text leading-relaxed list-disc pl-5"
          >
            <li i18n="@@formations.toolkit.content1">
              16 outils IA sélectionnés pour la génération de contenu,
              l'automatisation marketing, la création visuelle, la prospection
              commerciale et le support client — avec une fiche comparative pour
              chacun.
            </li>
            <li i18n="@@formations.toolkit.content2">
              Les budgets mensuels estimés par tier d'usage (solo, équipe,
              agence) pour dimensionner votre stack IA sans surpayer —
              typiquement 30 à 150 € / mois pour un solopreneur.
            </li>
            <li i18n="@@formations.toolkit.content3">
              3 workflows concrets clé en main : rédaction de newsletters hebdo,
              réponse client multilingue, création de visuels LinkedIn — chacun
              avec prompt, outil recommandé et temps gagné.
            </li>
            <li i18n="@@formations.toolkit.content4">
              Les pièges à éviter : outils payants qui ne tiennent pas leurs
              promesses, RGPD sur les données, hallucinations IA sur la partie
              juridique et comptable.
            </li>
          </ul>
        </section>

        <section
          class="mb-10 rounded-xl bg-scheme-surface border border-scheme-border p-6"
          aria-labelledby="toolkit-faq-heading"
        >
          <h2
            id="toolkit-faq-heading"
            class="font-heading text-h5 text-scheme-text mb-4"
            i18n="@@formations.toolkit.faqTitle"
          >
            Questions fréquentes
          </h2>
          <div class="space-y-5 text-sm md:text-base">
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.toolkit.faq1Q"
              >
                À qui s'adresse ce toolkit ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.toolkit.faq1A"
              >
                Aux solopreneurs, freelances et indépendants qui veulent gagner
                du temps sans se noyer dans les dizaines d'outils IA qui sortent
                chaque semaine. Niveau requis : zéro — les fiches expliquent pas
                à pas.
              </p>
            </div>
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.toolkit.faq2Q"
              >
                Pourquoi le toolkit est gratuit ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.toolkit.faq2A"
              >
                Parce que c'est une version condensée des formations que je
                vends en intra-entreprise. L'objectif est de démontrer la
                qualité du travail avant de proposer un accompagnement
                sur-mesure, si vous en avez besoin.
              </p>
            </div>
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.toolkit.faq3Q"
              >
                Comment le recevoir ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.toolkit.faq3A"
              >
                Laissez votre email dans le formulaire ci-dessus. Vous recevrez
                le PDF du toolkit dans la minute. Aucune newsletter automatique,
                aucun follow-up marketing : c'est promis, et conforme RGPD.
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
export class ToolkitComponent {}
