import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type {
  GroupeFormation,
  MotifRefusGroupe,
  ParticipantDeSeance,
} from '../../../../core/ports/formations.port';
import { readInputValue } from '../../../../shared/utils/dom-event.utils';

export interface RenommageDeGroupe {
  readonly groupe: GroupeFormation;
  readonly nom: string;
}

export interface AffectationDeParticipant {
  readonly participantId: string;
  readonly groupId: string | null;
}

const MESSAGES_DE_REFUS: Readonly<Record<MotifRefusGroupe, string>> = {
  'nom-deja-pris': $localize`:@@panneauGroupesNomDejaPris:Ce nom de groupe est déjà pris dans la séance.`,
  introuvable: $localize`:@@panneauGroupesIntrouvable:Ce groupe ou ce participant n’existe plus : la liste a été relue.`,
  echec: $localize`:@@panneauGroupesEchec:La modification des groupes n’a pas abouti. Réessayez.`,
};

function valeurChoisie(evenement: Event): string {
  const cible = evenement.target;
  return cible instanceof HTMLSelectElement ? cible.value : '';
}

@Component({
  selector: 'app-panneau-groupes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-groupes.component.scss',
  template: `
    <section class="panneau-groupes" aria-labelledby="panneau-groupes-titre">
      <h4 id="panneau-groupes-titre" class="panneau-groupes__titre" i18n="@@panneauGroupesTitre">
        Groupes de suivi
      </h4>
      @if (groupes().length === 0) {
        <p class="panneau-groupes__vide" i18n="@@panneauGroupesVide">
          Aucun groupe créé pour cette séance.
        </p>
      } @else {
        <ul class="panneau-groupes__liste">
          @for (groupe of groupes(); track groupe.id) {
            <li>
              <input
                data-testid="groupe-nom"
                [value]="groupe.name"
                [attr.aria-label]="libelleDuNom + ' ' + groupe.name"
                (change)="renommer(groupe, $event)"
              />
            </li>
          }
        </ul>
      }
      <form class="panneau-groupes__creation" (submit)="creer($event)">
        <input
          data-testid="groupe-nouveau"
          [value]="nouveauGroupe()"
          aria-label="Nouveau groupe"
          i18n-aria-label="@@panneauGroupesNouveauLibelle"
          placeholder="Nouveau groupe"
          i18n-placeholder="@@panneauGroupesNouveauIndice"
          (input)="saisirNouveauGroupe($event)"
        />
        <button type="submit" data-testid="groupe-creer" i18n="@@panneauGroupesCreer">Créer</button>
      </form>
      @if (messageDeRefus(); as message) {
        <p class="panneau-groupes__refus" role="alert" data-testid="groupes-refus">
          {{ message }}
        </p>
      }
      <h5 class="panneau-groupes__titre" i18n="@@panneauGroupesParticipants">Participants</h5>
      @if (participants().length === 0) {
        <p class="panneau-groupes__vide" i18n="@@panneauGroupesParticipantsVide">
          Aucun participant n’a encore rejoint la séance.
        </p>
      } @else {
        <ul class="panneau-groupes__liste">
          @for (participant of participants(); track participant.id) {
            <li
              class="panneau-groupes__participant"
              data-testid="participant"
              [attr.data-participant]="participant.id"
            >
              <label [for]="'participant-groupe-' + participant.id"
                >{{ participant.prenom }} {{ participant.nom }}</label
              >
              <select
                data-testid="participant-groupe"
                [id]="'participant-groupe-' + participant.id"
                (change)="affecter(participant, $event)"
              >
                <option
                  value=""
                  [selected]="participant.groupId === null"
                  i18n="@@panneauGroupesSansGroupe"
                >
                  Sans groupe
                </option>
                @for (groupe of groupes(); track groupe.id) {
                  <option [value]="groupe.id" [selected]="participant.groupId === groupe.id">
                    {{ groupe.name }}
                  </option>
                }
              </select>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class PanneauGroupesComponent {
  readonly groupes = input.required<readonly GroupeFormation[]>();
  readonly participants = input.required<readonly ParticipantDeSeance[]>();
  readonly refus = input<MotifRefusGroupe | null>(null);
  readonly creation = output<string>();
  readonly renommage = output<RenommageDeGroupe>();
  readonly affectation = output<AffectationDeParticipant>();

  protected readonly nouveauGroupe = signal('');
  protected readonly libelleDuNom = $localize`:@@panneauGroupesNomDuGroupe:Nom du groupe`;
  protected readonly messageDeRefus = computed(() => {
    const refus = this.refus();
    return refus === null ? null : MESSAGES_DE_REFUS[refus];
  });

  protected saisirNouveauGroupe(evenement: Event): void {
    this.nouveauGroupe.set(readInputValue(evenement));
  }

  protected creer(evenement: Event): void {
    evenement.preventDefault();
    const nom = this.nouveauGroupe().trim();
    if (nom === '') {
      return;
    }
    this.creation.emit(nom);
    this.nouveauGroupe.set('');
  }

  protected renommer(groupe: GroupeFormation, evenement: Event): void {
    const nom = readInputValue(evenement).trim();
    if (nom !== '' && nom !== groupe.name) {
      this.renommage.emit({ groupe, nom });
    }
  }

  protected affecter(participant: ParticipantDeSeance, evenement: Event): void {
    const choisi = valeurChoisie(evenement);
    const groupId = choisi === '' ? null : choisi;
    if (groupId !== participant.groupId) {
      this.affectation.emit({ participantId: participant.id, groupId });
    }
  }
}
