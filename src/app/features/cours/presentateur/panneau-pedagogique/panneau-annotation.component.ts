import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import type { AnnotationFormateur, GroupeFormation } from '../../../../core/ports/formations.port';
import { readInputValue } from '../../../../shared/utils/dom-event.utils';

export type EtatSauvegarde = 'repos' | 'en_cours' | 'enregistre' | 'echec';

export interface SaisieAnnotation {
  readonly screenId: string;
  readonly groupName: string;
  readonly note: string;
}

interface Brouillon {
  readonly groupe: string;
  readonly note: string;
  readonly modifie: boolean;
}

interface SourceDuBrouillon {
  readonly ecranId: string;
  readonly annotations: readonly AnnotationFormateur[];
}

const CLASSE_ENTIERE = 'Classe entière';

function noteDe(source: SourceDuBrouillon, groupe: string): string {
  return (
    source.annotations.find(
      (annotation) => annotation.screenId === source.ecranId && annotation.groupName === groupe,
    )?.note ?? ''
  );
}

function brouillonDeLEcran(source: SourceDuBrouillon): Brouillon {
  const premiere = source.annotations.find((annotation) => annotation.screenId === source.ecranId);
  return {
    groupe: premiere?.groupName ?? CLASSE_ENTIERE,
    note: premiere?.note ?? '',
    modifie: false,
  };
}

function valeurChoisie(evenement: Event): string {
  const cible = evenement.target;
  return cible instanceof HTMLSelectElement ? cible.value : CLASSE_ENTIERE;
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
      <label for="panneau-annotation-groupe" i18n="@@panneauAnnotationGroupe">Groupe suivi</label>
      <select
        id="panneau-annotation-groupe"
        data-testid="annotation-groupe"
        (change)="choisirLeGroupe($event)"
      >
        <option
          [value]="classeEntiere"
          [selected]="brouillon().groupe === classeEntiere"
          i18n="@@panneauAnnotationClasseEntiere"
        >
          Classe entière
        </option>
        @for (groupe of groupes(); track groupe.id) {
          <option [value]="groupe.name" [selected]="brouillon().groupe === groupe.name">
            {{ groupe.name }}
          </option>
        }
      </select>
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
  readonly groupes = input.required<readonly GroupeFormation[]>();
  readonly annotations = input.required<readonly AnnotationFormateur[]>();
  readonly etat = input.required<EtatSauvegarde>();
  readonly saisie = output<SaisieAnnotation>();

  protected readonly classeEntiere = CLASSE_ENTIERE;

  protected readonly brouillon = linkedSignal<SourceDuBrouillon, Brouillon>({
    source: () => ({ ecranId: this.ecranId(), annotations: this.annotations() }),
    computation: (source, precedent) => {
      if (precedent === undefined || precedent.source.ecranId !== source.ecranId) {
        return brouillonDeLEcran(source);
      }
      const serveur = noteDe(source, precedent.value.groupe);
      if (precedent.value.modifie && serveur !== precedent.value.note) {
        return precedent.value;
      }
      return { groupe: precedent.value.groupe, note: serveur, modifie: false };
    },
  });

  protected saisirLaNote(evenement: Event): void {
    const note = readInputValue(evenement);
    const groupe = this.brouillon().groupe;
    this.brouillon.set({ groupe, note, modifie: true });
    this.saisie.emit({ screenId: this.ecranId(), groupName: groupe, note });
  }

  protected choisirLeGroupe(evenement: Event): void {
    const groupe = valeurChoisie(evenement);
    const source = { ecranId: this.ecranId(), annotations: this.annotations() };
    this.brouillon.set({ groupe, note: noteDe(source, groupe), modifie: false });
  }
}
