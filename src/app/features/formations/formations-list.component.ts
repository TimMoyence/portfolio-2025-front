import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SvgIconComponent } from "../../shared/components/svg-icon.component";
import { FORMATIONS } from "./formations-list.data";

@Component({
  selector: "app-formations-list",
  standalone: true,
  imports: [RouterModule, SvgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero avec gradient -->
    <div
      class="relative overflow-hidden bg-gradient-to-br from-scheme-accent/5 via-scheme-background to-purple-500/5"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-scheme-accent/10 blur-3xl"
      ></div>
      <div
        class="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl"
      ></div>

      <div class="relative mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <span
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-scheme-accent/20 bg-scheme-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-scheme-accent"
          i18n="@@formationsListLabel"
        >
          <app-svg-icon name="sparkles" [size]="0.85"></app-svg-icon>
          Ressources gratuites
        </span>
        <h1
          class="mx-auto mb-6 max-w-3xl font-heading text-h1 text-scheme-text"
          i18n="@@formationsListTitle"
        >
          Formations & Présentations
        </h1>
        <p
          class="mx-auto max-w-2xl text-large text-scheme-text-muted"
          i18n="@@formationsListSubtitle"
        >
          Des présentations concrètes et pratiques pour tirer le meilleur de
          l'IA dans votre activité. Consultables en ligne ou en mode
          présentation — pensées pour les solopreneurs, freelances et petites
          équipes qui veulent des réponses actionnables, pas un cours
          universitaire.
        </p>
      </div>
    </div>

    <!-- Section pourquoi ces formations -->
    <section
      class="mx-auto max-w-4xl px-6 py-12"
      aria-labelledby="formations-why-heading"
    >
      <h2
        id="formations-why-heading"
        class="mb-4 font-heading text-h3 text-scheme-text"
        i18n="@@formationsListWhyTitle"
      >
        Pourquoi ces formations ?
      </h2>
      <p
        class="mb-4 text-base md:text-large text-scheme-text leading-relaxed"
        i18n="@@formationsListWhyPara1"
      >
        L'IA générative a changé le quotidien des indépendants en 18 mois :
        ChatGPT, Claude, Perplexity, Gemini, Midjourney, Notion AI, Zapier AI...
        La vraie difficulté n'est plus de trouver un outil, c'est de savoir
        lesquels garder et comment les intégrer sans perdre sa journée en prompt
        engineering.
      </p>
      <p
        class="mb-4 text-base md:text-large text-scheme-text leading-relaxed"
        i18n="@@formationsListWhyPara2"
      >
        Chaque formation est basée sur ma pratique quotidienne : développeur
        full-stack à Bordeaux, freelance depuis 3 ans, je teste les outils IA en
        production sur mes propres projets et ceux de mes clients. Je partage ce
        qui fonctionne, ce qui ne fonctionne pas et surtout les cas où l'IA fait
        gagner 4-6 heures par semaine concrètement.
      </p>
      <p
        class="mb-4 text-base md:text-large text-scheme-text leading-relaxed"
        i18n="@@formationsListWhyPara3"
      >
        Format pensé pour être consultable en ligne (slides interactifs, quiz en
        live, polls) ou en mode présentation si vous voulez les projeter en
        atelier d'équipe. Tout est gratuit, sans inscription, sans email
        obligatoire à part pour les compléments PDF.
      </p>
    </section>

    <!-- Grille de cartes -->
    <div class="mx-auto max-w-5xl px-6 pb-20">
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        @for (formation of formations; track formation.slug) {
          <a
            [routerLink]="['/formations', formation.slug]"
            class="group relative overflow-hidden rounded-2xl border border-scheme-border bg-scheme-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-scheme-accent/30"
          >
            <!-- Gradient header -->
            <div
              class="flex items-center justify-between bg-gradient-to-r from-scheme-accent/10 to-purple-500/10 px-6 py-5"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl bg-scheme-background shadow-xs text-2xl"
              >
                <app-svg-icon
                  [name]="formation.icon"
                  [size]="1.5"
                ></app-svg-icon>
              </div>
              <span
                class="rounded-full bg-scheme-accent px-3 py-1 text-xs font-bold text-scheme-on-accent"
              >
                {{ formation.badge }}
              </span>
            </div>

            <!-- Contenu -->
            <div class="p-6">
              <h2
                class="mb-3 font-heading text-h5 text-scheme-text transition-colors group-hover:text-scheme-accent"
              >
                {{ formation.title }}
              </h2>
              <p class="mb-5 text-small leading-relaxed text-scheme-text-muted">
                {{ formation.description }}
              </p>

              <!-- Meta -->
              <div
                class="flex items-center justify-between border-t border-scheme-border pt-4"
              >
                <div
                  class="flex items-center gap-3 text-xs text-scheme-text-muted"
                >
                  <span class="flex items-center gap-1">
                    <span
                      class="inline-block h-1.5 w-1.5 rounded-full bg-scheme-accent"
                    ></span>
                    {{ formation.duration }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span
                      class="inline-block h-1.5 w-1.5 rounded-full bg-purple-400"
                    ></span>
                    {{ formation.slidesCount }} slides
                  </span>
                </div>
                <span
                  class="text-xs font-medium text-scheme-accent transition-transform duration-200 group-hover:translate-x-1"
                  i18n="@@formationsListViewCta"
                >
                  Consulter &rarr;
                </span>
              </div>
            </div>
          </a>
        }
      </div>
    </div>

    <!-- FAQ -->
    <section
      class="mx-auto max-w-4xl px-6 py-16 border-t border-scheme-border"
      aria-labelledby="formations-faq-heading"
    >
      <h2
        id="formations-faq-heading"
        class="mb-6 font-heading text-h3 text-scheme-text"
        i18n="@@formationsListFaqTitle"
      >
        Questions fréquentes
      </h2>
      <div class="space-y-6">
        <div>
          <h3
            class="mb-2 font-heading text-h5 text-scheme-text"
            i18n="@@formationsListFaq1Q"
          >
            Les formations sont-elles vraiment gratuites ?
          </h3>
          <p
            class="text-base text-scheme-text-muted leading-relaxed"
            i18n="@@formationsListFaq1A"
          >
            Oui — les slides, quiz et polls en ligne sont entièrement gratuits
            et consultables sans inscription. Seuls certains compléments PDF
            (toolkit, prompts library) demandent un email pour l'envoi, que vous
            pouvez retirer à tout moment.
          </p>
        </div>
        <div>
          <h3
            class="mb-2 font-heading text-h5 text-scheme-text"
            i18n="@@formationsListFaq2Q"
          >
            Puis-je les utiliser en présentation d'équipe ?
          </h3>
          <p
            class="text-base text-scheme-text-muted leading-relaxed"
            i18n="@@formationsListFaq2A"
          >
            Absolument. Chaque formation a un mode "présentation" avec slides
            plein écran, polls live pour interagir avec l'audience et quiz pour
            valider la compréhension. Vous pouvez l'utiliser en atelier interne,
            en conférence ou en accompagnement client — mentionnez juste la
            source si vous le diffusez.
          </p>
        </div>
        <div>
          <h3
            class="mb-2 font-heading text-h5 text-scheme-text"
            i18n="@@formationsListFaq3Q"
          >
            À quelle fréquence sont-elles mises à jour ?
          </h3>
          <p
            class="text-base text-scheme-text-muted leading-relaxed"
            i18n="@@formationsListFaq3A"
          >
            Les outils IA évoluent vite. Chaque formation est relue tous les 3-4
            mois pour enlever ce qui ne fonctionne plus, ajouter les nouveautés
            qui tiennent la route et ajuster les budgets quand les grilles
            tarifaires changent. Les mises à jour majeures sont annoncées dans
            les slides concernés.
          </p>
        </div>
        <div>
          <h3
            class="mb-2 font-heading text-h5 text-scheme-text"
            i18n="@@formationsListFaq4Q"
          >
            Proposez-vous de l'accompagnement personnalisé ?
          </h3>
          <p
            class="text-base text-scheme-text-muted leading-relaxed"
            i18n="@@formationsListFaq4A"
          >
            Oui — au-delà des formations publiques, je fais aussi du coaching
            individuel et de la formation intra-entreprise sur l'intégration IA
            dans les workflows métier. Voir la
            <a routerLink="/fr/offer" class="underline text-scheme-accent">
              page offre
            </a>
            ou contactez-moi directement.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class FormationsListComponent {
  readonly formations = FORMATIONS;
}
