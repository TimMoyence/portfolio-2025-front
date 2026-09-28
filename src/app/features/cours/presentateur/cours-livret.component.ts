import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { LivretDuCours } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { SlideActivityComponent } from '../../../shared/slides/session/slide-activity.component';
import { chantierApresRendu } from './chantier-apres-rendu';
import { pagesDuCorrige, pagesDuLivretEtudiant } from './livret-papier';

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
          @for (ecran of pagesEtudiant(); track ecran.id) {
            <section class="livret__page" data-testid="livret-ecran" [attr.data-ecran]="ecran.id">
              <app-slide-activity [slide]="ecran" [role]="'etudiant'" [apercu]="true" />
            </section>
          }
        } @else {
          @for (page of pagesCorrige(); track page.ecran.id) {
            <section
              class="livret__page"
              data-testid="livret-corrige"
              [attr.data-ecran]="page.ecran.id"
            >
              <app-slide-activity
                [slide]="page.ecran"
                [role]="'presentateur'"
                [apercu]="true"
                [donneesFormateur]="page.annexe"
              />
              <aside class="livret__formateur">
                @if (page.ecran.corriges.length > 0) {
                  <ul class="livret__reponses" data-testid="livret-reponses">
                    @for (corrige of page.ecran.corriges; track corrige.questionId) {
                      <li>
                        <span class="livret__question">{{ corrige.questionId }}</span>
                        {{ corrige.bonneReponse }}
                      </li>
                    }
                  </ul>
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

  readonly pagesEtudiant = computed(() => {
    const livret = this.livret();
    return livret === null ? [] : pagesDuLivretEtudiant(livret.sujet);
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
