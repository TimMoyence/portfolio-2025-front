import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { LivretDuCours } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
import { chantierApresRendu } from './chantier-apres-rendu';
import { feuillesDuLivretEtudiant, pagesDuCorrige } from './livret-papier';

type VueDuLivret = 'sujet' | 'corrige';

@Component({
  selector: 'app-cours-livret',
  standalone: true,
  imports: [SlideActivityComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './cours-livret.component.scss',
  template: `
    <main class="livret">
      @if (echec()) {
        <p class="livret__echec" data-testid="livret-echec" role="alert" i18n="@@livretEchec">
          Le livret de ce cours n’a pas pu être chargé. Vérifiez la connexion, puis rechargez la
          page.
        </p>
      }
      @if (livret(); as lu) {
        <header class="livret__entete">
          <p class="livret__kicker" i18n="@@livretKicker">Livret papier</p>
          <h1 data-testid="livret-titre">{{ lu.sujet.titre }}</h1>
          <p class="livret__version" data-testid="livret-version" i18n="@@livretVersion">
            Version publiée n° {{ lu.version }}
          </p>
          @if (vue() === 'sujet') {
            @if (feuillesEtudiant().length === 1) {
              <p
                class="livret__annonce"
                data-testid="livret-annonce"
                i18n="@@livretAnnonceFicheUnique"
              >
                1 fiche · elle peut occuper plusieurs pages
              </p>
            } @else {
              <p class="livret__annonce" data-testid="livret-annonce" i18n="@@livretAnnonceFiches">
                {{ feuillesEtudiant().length }} fiches · chacune commence sur une nouvelle page,
                sauf la question qui ouvre une notion quand aucun exemple guidé de sa page n’attend
                de réponse sur la copie, et la fiche qui suit un exemple guidé imprimé en entier
                quand rien n’est encore à corriger sur sa page ; les plus longues en occupent
                plusieurs
              </p>
            }
          }
          <div
            class="livret__actions"
            role="group"
            aria-label="Vue du livret"
            i18n-aria-label="@@livretVueAria"
          >
            <button
              type="button"
              class="btn"
              data-testid="livret-vue-sujet"
              [attr.aria-pressed]="vue() === 'sujet'"
              (click)="vue.set('sujet')"
              i18n="@@livretVueSujet"
            >
              Livret étudiant
            </button>
            <button
              type="button"
              class="btn"
              data-testid="livret-vue-corrige"
              [attr.aria-pressed]="vue() === 'corrige'"
              (click)="vue.set('corrige')"
              i18n="@@livretVueCorrige"
            >
              Corrigé formateur
            </button>
            <button
              type="button"
              class="btn btn-teal"
              data-testid="livret-imprimer"
              (click)="imprimer()"
              i18n="@@livretImprimer"
            >
              Imprimer
            </button>
          </div>
        </header>
        @if (vue() === 'sujet') {
          @for (feuille of feuillesEtudiant(); track $index; let rang = $index) {
            <div
              class="livret__feuille"
              [class.livret__feuille--a-la-suite]="feuille.aLaSuite"
              data-testid="livret-feuille"
            >
              @for (page of feuille.pages; track page.ecran.id; let premiere = $first) {
                <section
                  class="livret__page"
                  data-testid="livret-ecran"
                  [attr.data-ecran]="page.ecran.id"
                >
                  @if (premiere) {
                    <p
                      class="livret__kicker"
                      data-testid="livret-feuille-entete"
                      i18n="@@livretFiche"
                    >
                      Fiche {{ rang + 1 }} / {{ feuillesEtudiant().length }}
                    </p>
                  }
                  @if (page.titre; as titre) {
                    <h2 class="livret__titre" data-testid="livret-titre-ecran">{{ titre }}</h2>
                  }
                  <app-slide-activity
                    [slide]="page.ecran"
                    [role]="'etudiant'"
                    [apercu]="true"
                    [papier]="true"
                  />
                </section>
              }
            </div>
          }
        } @else {
          @for (page of pagesCorrige(); track page.ecran.id) {
            <section
              class="livret__page"
              [class.livret__page--scindable]="!page.repeteLaSource"
              data-testid="livret-corrige"
              [attr.data-ecran]="page.ecran.id"
            >
              @if (page.repeteLaSource) {
                <h2 class="livret__titre" data-testid="livret-titre-correction">
                  {{ page.ecran.titre }}
                </h2>
              } @else {
                <app-slide-activity
                  [slide]="page.ecran"
                  [role]="'presentateur'"
                  [apercu]="true"
                  [papier]="true"
                  [donneesFormateur]="page.annexe"
                />
              }
              <aside class="livret__formateur">
                @if (page.attendu; as reflexion) {
                  <div class="livret__attendu" data-testid="livret-attendu">
                    <p class="livret__question" i18n="@@livretGuideReponse">Réponse attendue</p>
                    <p>{{ reflexion.attendu }}</p>
                    <p>{{ reflexion.suite }}</p>
                  </div>
                }
                @if (page.reponses.length > 0) {
                  <ol class="livret__reponses" data-testid="livret-reponses">
                    @for (reponse of page.reponses; track reponse.corrige.questionId) {
                      <li>
                        <span class="livret__question"
                          >{{ reponse.numero }}. {{ reponse.enonce }}</span
                        >
                        {{ reponse.corrige.bonneReponse }}
                      </li>
                    }
                  </ol>
                }
                @if (page.guide.length > 0) {
                  <dl class="livret__guide" data-testid="livret-guide">
                    @for (rubrique of page.guide; track rubrique.cle) {
                      <div>
                        <dt>{{ rubrique.libelle }}</dt>
                        <dd>{{ rubrique.texte }}</dd>
                      </div>
                    }
                  </dl>
                }
                @if (page.ecran.notes !== '') {
                  <p class="livret__notes" data-testid="livret-notes">{{ page.ecran.notes }}</p>
                }
              </aside>
            </section>
          }
        }
      }
    </main>
  `,
})
export class CoursLivretComponent {
  readonly slug = input.required<string>();

  readonly livret = signal<LivretDuCours | null>(null);
  readonly echec = signal(false);
  readonly vue = signal<VueDuLivret>('sujet');

  readonly feuillesEtudiant = computed(() => {
    const livret = this.livret();
    return livret === null ? [] : feuillesDuLivretEtudiant(livret.sujet, livret.corrige);
  });

  readonly pagesCorrige = computed(() => {
    const livret = this.livret();
    return livret === null ? [] : pagesDuCorrige(livret.corrige);
  });

  private readonly document = inject(DOCUMENT);

  protected imprimer(): void {
    this.document.defaultView?.print();
  }

  private readonly port = inject(FORMATIONS_PORT);
  private readonly lecture = chantierApresRendu(() => this.chargerLeLivret());

  quandStabilise(): Promise<void> {
    return this.lecture;
  }

  private async chargerLeLivret(): Promise<void> {
    try {
      this.livret.set(await firstValueFrom(this.port.lireLivret(this.slug())));
    } catch {
      this.echec.set(true);
    }
  }
}
