import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import type { AnnotationFormateur } from '../../../../core/ports/formations.port';
import { readInputValue } from '../../../../shared/utils/dom-event.utils';

export type EtatSauvegarde = 'repos' | 'en_cours' | 'enregistre' | 'echec';

export interface SaisieAnnotation {
  readonly screenId: string;
  readonly note: string;
}

interface Brouillon {
  readonly note: string;
  readonly modifie: boolean;
}

interface SourceDuBrouillon {
  readonly ecranId: string;
  readonly annotations: readonly AnnotationFormateur[];
}

function noteDe(source: SourceDuBrouillon): string {
  return (
    source.annotations.find((annotation) => annotation.screenId === source.ecranId)?.note ?? ''
  );
}

@Component({
  selector: 'app-panneau-annotation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-annotation.component.scss',
  template: `
    <section class="panneau-annotation" aria-labelledby="panneau-annotation-titre">
      <h4
        id="panneau-annotation-titre"
        class="panneau-annotation__titre"
        i18n="@@panneauAnnotationTitre"
      >
        Annotation du formateur
      </h4>
      <label for="panneau-annotation-note" i18n="@@panneauAnnotationNote">Note du formateur</label>
      <textarea
        id="panneau-annotation-note"
        data-testid="annotation-note"
        [value]="brouillon().note"
        placeholder="Observation, étudiant à relancer, exemple à reprendre…"
        i18n-placeholder="@@panneauAnnotationIndice"
        (input)="saisirLaNote($event)"
      ></textarea>
      <p
        class="panneau-annotation__etat"
        data-testid="annotation-etat"
        role="status"
        [attr.data-etat]="etat()"
      >
        @switch (etat()) {
          @case ('en_cours') {
            <span i18n="@@panneauAnnotationEnCours">Enregistrement en cours…</span>
          }
          @case ('enregistre') {
            <span i18n="@@panneauAnnotationEnregistre">Note enregistrée sur le serveur.</span>
          }
          @case ('echec') {
            <span i18n="@@panneauAnnotationEchec"
              >La note n’a pas pu être enregistrée : elle reste affichée ici, reprenez la saisie
              pour réessayer.</span
            >
          }
        }
      </p>
    </section>
  `,
})
export class PanneauAnnotationComponent {
  readonly ecranId = input.required<string>();
  readonly annotations = input.required<readonly AnnotationFormateur[]>();
  readonly etat = input.required<EtatSauvegarde>();
  readonly saisie = output<SaisieAnnotation>();

  protected readonly brouillon = linkedSignal<SourceDuBrouillon, Brouillon>({
    source: () => ({ ecranId: this.ecranId(), annotations: this.annotations() }),
    computation: (source, precedent) => {
      const serveur = noteDe(source);
      if (
        precedent !== undefined &&
        precedent.source.ecranId === source.ecranId &&
        precedent.value.modifie &&
        serveur !== precedent.value.note
      ) {
        return precedent.value;
      }
      return { note: serveur, modifie: false };
    },
  });

  protected saisirLaNote(evenement: Event): void {
    const note = readInputValue(evenement);
    this.brouillon.set({ note, modifie: true });
    this.saisie.emit({ screenId: this.ecranId(), note });
  }
}
