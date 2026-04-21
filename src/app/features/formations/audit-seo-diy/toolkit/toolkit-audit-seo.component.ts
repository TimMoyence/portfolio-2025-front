import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ToolkitFormComponent } from "../../../../shared/components/toolkit-form/toolkit-form.component";

/**
 * Page toolkit pour la formation "Audit SEO DIY".
 *
 * Capture l'email de l'utilisateur et declenche l'envoi du PDF
 * "Checklist audit SEO + rapport type" via le pipeline lead-magnet.
 * Contenu editorial present pour eviter la penalite "thin content" et
 * maximiser les signaux AEO (H2-questions + reponses 50-100 mots).
 */
@Component({
  selector: "app-toolkit-audit-seo",
  standalone: true,
  imports: [RouterLink, ToolkitFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-scheme-background px-4 py-12">
      <div class="mx-auto max-w-2xl">
        <header class="text-center mb-10">
          <h1
            class="font-heading text-h3 text-scheme-text mb-3"
            i18n="@@formations.audit-seo.toolkit.title"
          >
            Recevez votre checklist audit SEO
          </h1>
          <p
            class="text-base text-scheme-text-muted leading-relaxed"
            i18n="@@formations.audit-seo.toolkit.subtitle"
          >
            Les 7 checks SEO de la formation — avec les liens directs vers les 5
            outils gratuits, le template de rapport à imprimer et le script pour
            briefer un développeur — livrés en PDF dans votre boîte mail en 30
            secondes. Gratuit, sans engagement.
          </p>
        </header>

        <section
          class="bg-white rounded-xl border border-scheme-border p-6 shadow-sm mb-10"
        >
          <app-toolkit-form formationSlug="audit-seo-diy" />
        </section>

        <section
          class="mb-10 rounded-xl bg-scheme-surface border border-scheme-border p-6"
          aria-labelledby="toolkit-seo-contents-heading"
        >
          <h2
            id="toolkit-seo-contents-heading"
            class="font-heading text-h5 text-scheme-text mb-4"
            i18n="@@formations.audit-seo.toolkit.contentsTitle"
          >
            Ce que contient le toolkit
          </h2>
          <ul
            class="space-y-3 text-sm md:text-base text-scheme-text leading-relaxed list-disc pl-5"
          >
            <li i18n="@@formations.audit-seo.toolkit.content1">
              La checklist imprimable des 7 points à vérifier — indexation,
              titres, vitesse, mobile, contenu, questions-réponses, signaux AEO
              — avec colonne OK / à corriger / urgent à cocher.
            </li>
            <li i18n="@@formations.audit-seo.toolkit.content2">
              Le template de rapport d'audit sur une page A4 au format Google
              Sheets dupliquable — 3 colonnes (check, verdict, action) prêtes à
              remplir pour vos clients ou votre propre site.
            </li>
            <li i18n="@@formations.audit-seo.toolkit.content3">
              Les 5 outils SEO gratuits avec liens directs et mode d'emploi
              commenté — Google Search Console, PageSpeed Insights, Bing
              Webmaster, Ahrefs Webmaster Tools, SEO Meta in 1 Click.
            </li>
            <li i18n="@@formations.audit-seo.toolkit.content4">
              Le script "briefer un développeur" — les 5 questions
              non-techniques à poser pour faire corriger les problèmes SEO sans
              être baladé(e) par un jargon incompréhensible.
            </li>
          </ul>
        </section>

        <section
          class="mb-10 rounded-xl bg-scheme-surface border border-scheme-border p-6"
          aria-labelledby="toolkit-seo-faq-heading"
        >
          <h2
            id="toolkit-seo-faq-heading"
            class="font-heading text-h5 text-scheme-text mb-4"
            i18n="@@formations.audit-seo.toolkit.faqTitle"
          >
            Questions fréquentes
          </h2>
          <div class="space-y-5 text-sm md:text-base">
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.audit-seo.toolkit.faq1Q"
              >
                Puis-je faire cet audit sans compétence technique ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.audit-seo.toolkit.faq1A"
              >
                Oui entièrement. Chaque check utilise Google directement ou des
                outils avec un formulaire. Aucun terminal, aucun code. Si vous
                savez faire une recherche Google, vous savez lire le verdict de
                chaque outil présenté dans le toolkit.
              </p>
            </div>
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.audit-seo.toolkit.faq2Q"
              >
                Combien de temps pour voir des résultats SEO ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.audit-seo.toolkit.faq2A"
              >
                Les corrections techniques (indexation, vitesse) produisent des
                effets visibles en 2 à 4 semaines. Les améliorations de contenu
                prennent 3 à 6 mois pour grimper dans les résultats. SEO =
                marathon, pas sprint.
              </p>
            </div>
            <div>
              <h3
                class="font-semibold text-scheme-text mb-1"
                i18n="@@formations.audit-seo.toolkit.faq3Q"
              >
                Comment recevoir le toolkit ?
              </h3>
              <p
                class="text-scheme-text-muted leading-relaxed"
                i18n="@@formations.audit-seo.toolkit.faq3A"
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
export class ToolkitAuditSeoComponent {}
