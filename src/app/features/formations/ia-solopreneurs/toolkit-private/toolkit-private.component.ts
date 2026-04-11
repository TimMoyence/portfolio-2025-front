import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { LEAD_MAGNET_PORT } from "../../../../core/ports/lead-magnet.port";
import type { ToolkitPageData } from "../../../../core/models/toolkit-page.model";

type PageState = "loading" | "loaded" | "error";

/**
 * Page privee du toolkit personnalise.
 *
 * Accessible via un token unique envoye par email.
 * Affiche les 5 sections du toolkit : cheatsheet, prompts, workflows,
 * templates, et le prompt Gamma personnalise.
 */
@Component({
  selector: "app-toolkit-private",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ("loading") {
        <div
          class="min-h-screen flex items-center justify-center bg-scheme-background"
        >
          <div class="text-center">
            <div
              class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-scheme-accent"
            ></div>
            <p class="mt-4 text-sm text-scheme-text-muted">
              Chargement de votre toolkit...
            </p>
          </div>
        </div>
      }

      @case ("error") {
        <div
          class="min-h-screen flex items-center justify-center bg-scheme-background px-4"
        >
          <div class="text-center max-w-md">
            <p class="text-lg font-medium text-red-600">
              Impossible de charger le toolkit
            </p>
            <p class="mt-2 text-sm text-scheme-text-muted">
              Le lien est peut-etre expire ou invalide. Verifiez votre email ou
              refaites une demande.
            </p>
          </div>
        </div>
      }

      @case ("loaded") {
        @if (data(); as toolkit) {
          <div class="min-h-screen bg-scheme-background">
            <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
              <!-- En-tete -->
              <div class="text-center mb-12">
                <h1 class="font-heading text-h2 sm:text-h1 text-scheme-text">
                  Votre boite a outils IA
                </h1>
                <p class="mt-3 text-base text-scheme-text-muted">
                  Bonjour {{ toolkit.recap.firstName }}, voici votre toolkit
                  personnalise.
                </p>
              </div>

              <!-- Section 1 : Cheatsheet -->
              @if (toolkit.cheatsheet.length > 0) {
                <section class="mb-12">
                  <h2
                    class="font-heading text-h4 text-scheme-text mb-6 flex items-center gap-2"
                  >
                    <span class="text-scheme-accent">1.</span> Les 16 outils en
                    un coup d'oeil
                  </h2>
                  <div
                    class="overflow-x-auto rounded-xl border border-scheme-border shadow-sm"
                  >
                    <table class="min-w-full text-sm">
                      <thead class="bg-gray-50">
                        <tr>
                          <th
                            class="px-4 py-3 text-left font-semibold text-gray-700"
                          >
                            Outil
                          </th>
                          <th
                            class="px-4 py-3 text-left font-semibold text-gray-700"
                          >
                            Categorie
                          </th>
                          <th
                            class="px-4 py-3 text-left font-semibold text-gray-700"
                          >
                            Prix
                          </th>
                          <th
                            class="px-4 py-3 text-left font-semibold text-gray-700"
                          >
                            En une phrase
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (entry of toolkit.cheatsheet; track entry.tool) {
                          <tr class="border-t border-gray-100 hover:bg-gray-50">
                            <td
                              class="px-4 py-3 font-medium text-scheme-accent"
                            >
                              <a
                                [href]="entry.url"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="underline hover:no-underline"
                              >
                                {{ entry.tool }}
                              </a>
                            </td>
                            <td class="px-4 py-3 text-gray-600">
                              {{ entry.category }}
                            </td>
                            <td class="px-4 py-3 text-gray-600">
                              {{ entry.price }}
                            </td>
                            <td class="px-4 py-3 text-gray-600">
                              {{ entry.tip }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </section>
              }

              <!-- Section 2 : Prompts -->
              @if (toolkit.prompts.length > 0) {
                <section class="mb-12">
                  <h2
                    class="font-heading text-h4 text-scheme-text mb-6 flex items-center gap-2"
                  >
                    <span class="text-scheme-accent">2.</span> Prompts prets a
                    copier
                  </h2>
                  <div class="space-y-4">
                    @for (prompt of toolkit.prompts; track prompt.title) {
                      <div
                        class="rounded-xl border border-scheme-border bg-white p-5 shadow-sm"
                      >
                        <h3
                          class="text-base font-semibold text-scheme-text mb-1"
                        >
                          {{ prompt.title }}
                        </h3>
                        <p class="text-sm text-scheme-text-muted mb-3">
                          {{ prompt.category }} · {{ prompt.tool }} ·
                          {{ prompt.level }}
                        </p>
                        <div
                          class="relative rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <pre
                            class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed"
                            >{{ prompt.prompt }}</pre
                          >
                          <button
                            type="button"
                            class="absolute top-2 right-2 rounded-full border border-scheme-accent/30 bg-scheme-accent/10 px-3 py-1.5 text-xs font-semibold text-scheme-accent transition hover:bg-scheme-accent/20"
                            (click)="copyToClipboard(prompt.prompt)"
                          >
                            {{
                              copiedText() === prompt.prompt
                                ? "Copie !"
                                : "Copier"
                            }}
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- Section 3 : Workflows -->
              @if (toolkit.workflows.length > 0) {
                <section class="mb-12">
                  <h2
                    class="font-heading text-h4 text-scheme-text mb-6 flex items-center gap-2"
                  >
                    <span class="text-scheme-accent">3.</span> Workflows a
                    mettre en place
                  </h2>
                  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @for (workflow of toolkit.workflows; track workflow.title) {
                      <div
                        class="rounded-xl border border-scheme-border bg-white p-5 shadow-sm"
                      >
                        <h3
                          class="text-base font-semibold text-scheme-text mb-1"
                        >
                          {{ workflow.title }}
                        </h3>
                        <p class="text-sm text-scheme-text-muted mb-3">
                          {{ workflow.description }}
                        </p>
                        <div class="flex flex-wrap gap-1.5 mb-3">
                          @for (tool of workflow.tools; track tool) {
                            <span
                              class="rounded-full bg-scheme-accent/10 px-2.5 py-1 text-xs font-medium text-scheme-accent"
                            >
                              {{ tool }}
                            </span>
                          }
                        </div>
                        <ol class="space-y-1.5 text-sm text-gray-600">
                          @for (step of workflow.steps; track step.step) {
                            <li class="flex gap-2">
                              <span
                                class="flex-shrink-0 font-semibold text-scheme-accent"
                                >{{ step.step }}.</span
                              >
                              <span>
                                <strong>{{ step.action }}</strong>
                                ({{ step.tool }}) — {{ step.detail }}
                              </span>
                            </li>
                          }
                        </ol>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- Section 4 : Templates -->
              @if (toolkit.templates.length > 0) {
                <section class="mb-12">
                  <h2
                    class="font-heading text-h4 text-scheme-text mb-6 flex items-center gap-2"
                  >
                    <span class="text-scheme-accent">4.</span> Templates
                    reutilisables
                  </h2>
                  <div class="grid gap-4 sm:grid-cols-2">
                    @for (tmpl of toolkit.templates; track tmpl.name) {
                      <a
                        [href]="tmpl.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block rounded-xl border border-scheme-border bg-white p-5 shadow-sm hover:border-scheme-accent transition-colors"
                      >
                        <div class="flex items-center gap-2 mb-1">
                          <h3 class="text-base font-semibold text-scheme-text">
                            {{ tmpl.name }}
                          </h3>
                          <span
                            class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {{ tmpl.platform }}
                          </span>
                        </div>
                        <p class="text-sm text-scheme-text-muted">
                          {{ tmpl.description }}
                        </p>
                      </a>
                    }
                  </div>
                </section>
              }

              <!-- Section 5 : Prompt Gamma personnalise -->
              @if (toolkit.generatedPrompt) {
                <section class="mb-12">
                  <h2
                    class="font-heading text-h4 text-scheme-text mb-6 flex items-center gap-2"
                  >
                    <span class="text-scheme-accent">5.</span> Votre prompt
                    Gamma personnalise
                  </h2>
                  <div
                    class="rounded-xl border-2 border-scheme-accent/20 bg-scheme-accent/[0.03] p-5 sm:p-6"
                  >
                    <div
                      class="relative rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <pre
                        class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed"
                        >{{ toolkit.generatedPrompt }}</pre
                      >
                      <button
                        type="button"
                        class="absolute top-2 right-2 rounded-full border border-scheme-accent/30 bg-scheme-accent/10 px-3 py-1.5 text-xs font-semibold text-scheme-accent transition hover:bg-scheme-accent/20"
                        (click)="copyToClipboard(toolkit.generatedPrompt!)"
                      >
                        {{
                          copiedText() === toolkit.generatedPrompt
                            ? "Copie !"
                            : "Copier"
                        }}
                      </button>
                    </div>
                    <p class="mt-3 text-xs text-scheme-text-muted">
                      Collez ce prompt dans
                      <a
                        href="https://gamma.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-scheme-accent underline hover:no-underline"
                        >gamma.app</a
                      >
                      pour generer votre presentation en 60 secondes.
                    </p>
                  </div>
                </section>
              }

              <!-- Footer -->
              <footer class="text-center pt-8 border-t border-scheme-border">
                <p class="text-xs text-scheme-text-muted">
                  Asili Design — asilidesign.fr
                </p>
              </footer>
            </div>
          </div>
        }
      }
    }
  `,
})
export class ToolkitPrivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly port = inject(LEAD_MAGNET_PORT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly state = signal<PageState>("loading");
  readonly data = signal<ToolkitPageData | null>(null);
  /** Texte qui vient d'etre copie, pour le feedback visuel. */
  readonly copiedText = signal<string | null>(null);

  /** Vrai si les donnees sont chargees — raccourci pour le template. */
  readonly isLoaded = computed(
    () => this.state() === "loaded" && this.data() !== null,
  );

  constructor() {
    const token = this.route.snapshot.paramMap.get("token");
    if (!token) {
      this.state.set("error");
      return;
    }
    this.port.getToolkitByToken(token).subscribe({
      next: (pageData) => {
        this.data.set(pageData);
        this.state.set("loaded");
      },
      error: () => {
        this.state.set("error");
      },
    });
  }

  /**
   * Copie un texte dans le presse-papier avec feedback temporaire.
   * Protege par un guard SSR (Clipboard API indisponible cote serveur).
   */
  copyToClipboard(text: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard?.writeText(text).then(() => {
      this.copiedText.set(text);
      setTimeout(() => this.copiedText.set(null), 2000);
    });
  }
}
