import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ParticipantDeSeance } from '../../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../../core/ports/formations.port';

type LectureDesParticipants = 'fermee' | 'chargement' | 'ouverte' | 'echec';

@Component({
  selector: 'app-panneau-participants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panneau-participants.component.scss',
  template: `
    <section class="panneau-participants" data-testid="activite-participants">
      <div class="panneau-participants__tete">
        <h3 i18n="@@panneauActiviteParticipantsTitre">Participants</h3>
        @if (lecture() === 'fermee') {
          <button
            type="button"
            class="control-btn"
            data-testid="activite-participants-afficher"
            [disabled]="sessionId() === null"
            (click)="afficherLesParticipants()"
            i18n="@@panneauActiviteParticipantsAfficher"
          >
            Afficher les participants
          </button>
        } @else {
          <button
            type="button"
            class="control-btn"
            data-testid="activite-participants-masquer"
            (click)="masquerLesParticipants()"
            i18n="@@panneauActiviteParticipantsMasquer"
          >
            Masquer les participants
          </button>
        }
      </div>
      @switch (lecture()) {
        @case ('chargement') {
          <p role="status" i18n="@@panneauActiviteParticipantsChargement">Chargement…</p>
        }
        @case ('echec') {
          <p
            role="alert"
            data-testid="activite-participants-echec"
            i18n="@@panneauActiviteParticipantsEchec"
          >
            La liste des participants n’a pas pu être lue.
          </p>
          <button
            type="button"
            class="control-btn"
            data-testid="activite-participants-reessayer"
            (click)="afficherLesParticipants()"
            i18n="@@panneauActiviteParticipantsReessayer"
          >
            Réessayer
          </button>
        }
        @case ('ouverte') {
          <ul class="panneau-participants__liste">
            @for (participant of listeDesParticipants(); track participant.id) {
              <li
                data-testid="activite-participant"
                [attr.data-participant]="participant.id"
                [attr.data-evince]="participant.evince"
              >
                <span>{{ participant.prenom }} {{ participant.nom }}</span>
                @if (participant.evince) {
                  <button
                    type="button"
                    class="control-btn"
                    data-testid="activite-readmettre"
                    (click)="readmettre(participant)"
                    i18n="@@panneauActiviteReadmettre"
                  >
                    Réadmettre dans la séance
                  </button>
                } @else {
                  <button
                    type="button"
                    class="control-danger"
                    data-testid="activite-evincer"
                    (click)="evincer(participant)"
                    i18n="@@panneauActiviteEvincer"
                  >
                    Retirer de la séance
                  </button>
                }
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class PanneauParticipantsComponent {
  readonly sessionId = input<string | null>(null);

  protected readonly lecture = signal<LectureDesParticipants>('fermee');
  protected readonly listeDesParticipants = signal<readonly ParticipantDeSeance[]>([]);

  private readonly port = inject(FORMATIONS_PORT);

  protected async afficherLesParticipants(): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    this.lecture.set('chargement');
    try {
      const { participants } = await firstValueFrom(this.port.lireParticipants(sessionId));
      this.listeDesParticipants.set(participants);
      this.lecture.set('ouverte');
    } catch {
      this.lecture.set('echec');
    }
  }

  protected masquerLesParticipants(): void {
    this.lecture.set('fermee');
  }

  protected evincer(participant: ParticipantDeSeance): Promise<void> {
    return this.basculerLEviction(participant, true);
  }

  protected readmettre(participant: ParticipantDeSeance): Promise<void> {
    return this.basculerLEviction(participant, false);
  }

  private async basculerLEviction(
    participant: ParticipantDeSeance,
    evince: boolean,
  ): Promise<void> {
    const sessionId = this.sessionId();
    if (sessionId === null) {
      return;
    }
    const commande = evince
      ? this.port.evincerParticipant(sessionId, participant.id)
      : this.port.readmettreParticipant(sessionId, participant.id);
    try {
      await firstValueFrom(commande, { defaultValue: undefined });
      this.listeDesParticipants.update((liste) =>
        liste.map((candidat) =>
          candidat.id === participant.id ? { ...candidat, evince } : candidat,
        ),
      );
    } catch {
      this.lecture.set('echec');
    }
  }
}
