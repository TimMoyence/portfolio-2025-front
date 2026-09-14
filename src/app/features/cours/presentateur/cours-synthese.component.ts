import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ParticipantRapporte, RapportSeance } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';

interface LigneClassement {
  participant: ParticipantRapporte;
  sansReponse: boolean;
}

interface ConceptCompte {
  concept: string;
  effectif: number;
}

const SEPARATEUR = ';';

const ENTETE: readonly string[] = [
  'prenom',
  'nom',
  'adresse',
  'question',
  'concept',
  'valeur',
  'duree_ms',
];

const CARACTERES_A_PROTEGER = /[;"\n\r]/;

function echapper(champ: string): string {
  return CARACTERES_A_PROTEGER.test(champ) ? `"${champ.replaceAll('"', '""')}"` : champ;
}

function ligneCsv(champs: readonly string[]): string {
  return champs.map(echapper).join(SEPARATEUR);
}

@Component({
  selector: 'app-cours-synthese',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 i18n="synthese.titre|@@syntheseTitre">Synthèse de la séance</h2>
    @if (vide()) {
      <p data-testid="synthese-vide" role="status" i18n="synthese.vide|@@syntheseVide">
        Aucun participant n'a rejoint cette séance : il n'y a rien à analyser.
      </p>
    } @else {
      <table data-testid="synthese-classement">
        <thead>
          <tr>
            <th i18n="synthese.etudiant|@@syntheseEtudiant">Étudiant</th>
            <th i18n="synthese.score|@@syntheseScore">Score</th>
            <th i18n="synthese.avancement|@@syntheseAvancement">Avancement</th>
          </tr>
        </thead>
        <tbody>
          @for (ligne of classement(); track ligne.participant.email) {
            <tr data-testid="synthese-ligne">
              <td data-testid="synthese-nom">
                {{ ligne.participant.prenom }} {{ ligne.participant.nom }}
              </td>
              @if (ligne.sansReponse) {
                <td
                  data-testid="synthese-sans-reponse"
                  i18n="synthese.sansReponse|@@syntheseSansReponse"
                >
                  N'a répondu à aucune question
                </td>
              } @else {
                <td data-testid="synthese-score">{{ ligne.participant.note }}</td>
              }
              <td>{{ ligne.participant.completion }}</td>
            </tr>
          }
        </tbody>
      </table>
      <section>
        <h3 i18n="synthese.fragiles|@@syntheseFragiles">Ce qui a le plus accroché</h3>
        <ul data-testid="synthese-fragiles">
          @for (fragile of fragiles(); track fragile.concept) {
            <li data-testid="synthese-fragile">
              <span data-testid="synthese-fragile-concept">{{ fragile.concept }}</span>
              <span data-testid="synthese-fragile-effectif">{{ fragile.effectif }}</span>
              <span i18n="synthese.sousSeuil|@@syntheseSousSeuil">étudiants sous le seuil</span>
            </li>
          }
        </ul>
      </section>
      <button
        type="button"
        data-testid="synthese-export"
        (click)="telecharger()"
        i18n="synthese.export|@@syntheseExport"
      >
        Exporter les réponses en CSV
      </button>
    }
    @if (echec()) {
      <p data-testid="synthese-echec" role="alert" i18n="synthese.echec|@@syntheseEchec">
        La synthèse n'a pas pu être lue. Rechargez la page, puis réessayez.
      </p>
    }
  `,
})
export class CoursSyntheseComponent {
  readonly sessionId = input.required<string>();

  readonly rapport = signal<RapportSeance | null>(null);
  readonly echec = signal(false);

  readonly vide = computed(() => this.rapport()?.participants.length === 0);

  readonly classement = computed<readonly LigneClassement[]>(() => {
    const participants = this.rapport()?.participants ?? [];
    const lignes = participants.map((participant) => ({
      participant,
      sansReponse: participant.reponses.length === 0,
    }));
    return [
      ...lignes
        .filter((ligne) => !ligne.sansReponse)
        .sort((gauche, droite) => gauche.participant.note - droite.participant.note),
      ...lignes.filter((ligne) => ligne.sansReponse),
    ];
  });

  readonly fragiles = computed<readonly ConceptCompte[]>(() => {
    const rapport = this.rapport();
    if (rapport === null) {
      return [];
    }
    return rapport.conceptsFragiles
      .map((concept) => ({ concept, effectif: this.compterLesFreins(rapport, concept) }))
      .sort((gauche, droite) => droite.effectif - gauche.effectif);
  });

  private readonly port = inject(FORMATIONS_PORT);

  private acheve: () => void = () => undefined;
  private readonly chantier = new Promise<void>((resoudre) => {
    this.acheve = resoudre;
  });

  constructor() {
    afterNextRender(() => {
      void this.lire().then(this.acheve);
    });
  }

  quandStabilise(): Promise<void> {
    return this.chantier;
  }

  exporterCsv(): string {
    const participants = this.rapport()?.participants ?? [];
    const lignes = participants.flatMap((participant) =>
      participant.reponses.map((reponse) =>
        ligneCsv([
          participant.prenom,
          participant.nom,
          participant.email,
          reponse.questionId,
          reponse.concept,
          reponse.valeur,
          String(reponse.dureeMs),
        ]),
      ),
    );
    return [ENTETE.join(SEPARATEUR), ...lignes].join('\n');
  }

  protected telecharger(): void {
    const fichier = new Blob([this.exporterCsv()], { type: 'text/csv;charset=utf-8' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(fichier);
    lien.download = `seance-${this.sessionId()}.csv`;
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  private compterLesFreins(rapport: RapportSeance, concept: string): number {
    return rapport.participants.filter(
      (participant) =>
        participant.sousSeuil &&
        participant.reponses.some((reponse) => reponse.concept === concept),
    ).length;
  }

  private async lire(): Promise<void> {
    try {
      this.rapport.set(await firstValueFrom(this.port.lireResultats(this.sessionId())));
    } catch {
      this.echec.set(true);
    }
  }
}
