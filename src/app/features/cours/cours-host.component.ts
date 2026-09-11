import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  signal,
} from '@angular/core';
import type { VoteQuestionPublique } from '../../../cours/runtime/blocks/FpVote';
import type { IdentityRegistration } from '../../../cours/runtime/core/identity';

type EtatHote = 'chargement' | 'identite' | 'pret' | 'erreur';

const QUESTION_DEMO: VoteQuestionPublique = {
  id: 'Q-CAP-03',
  enonce: 'Un capital de 1 000 € placé à 4 % pendant 10 ans (intérêts composés) vaut environ :',
  options: [
    { id: 'a', libelle: '1 400 €' },
    { id: 'b', libelle: '1 480,24 €' },
    { id: 'c', libelle: '10 400 €' },
  ],
};

@Component({
  selector: 'app-cours-host',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (etat() === 'chargement') {
      <p data-testid="cours-chargement" i18n="cours.chargement|@@coursChargement">
        Chargement du cours…
      </p>
    }
    @if (etat() === 'identite') {
      <form data-testid="cours-identite" (submit)="enregistrer($event)">
        <label for="cours-prenom" i18n="cours.prenom|@@coursPrenom">Prénom</label>
        <input id="cours-prenom" name="prenom" required />
        <label for="cours-nom" i18n="cours.nom|@@coursNom">Nom</label>
        <input id="cours-nom" name="nom" required />
        <label for="cours-email" i18n="cours.email|@@coursEmail">Adresse e-mail</label>
        <input id="cours-email" name="email" type="email" required />
        <button type="submit" i18n="cours.rejoindre|@@coursRejoindre">Rejoindre</button>
        @if (identiteRefusee()) {
          <p
            data-testid="cours-identite-refus"
            role="alert"
            i18n="cours.identiteRefus|@@coursIdentiteRefus"
          >
            Vos informations n'ont pas pu être prises en compte : vérifiez votre prénom, votre nom
            et votre adresse e-mail, puis réessayez.
          </p>
        }
      </form>
    }
    @if (etat() === 'pret') {
      @if (sansMemoire()) {
        <p
          data-testid="cours-sans-memoire"
          role="status"
          i18n="cours.sansMemoire|@@coursSansMemoire"
        >
          Ce poste ne peut rien mémoriser : le cours continue normalement, mais si vous rechargez la
          page ou fermez l'onglet, vous devrez vous réinscrire et repartir du début. Signalez-le à
          votre formateur.
        </p>
      }
      <fp-vote [attr.render]="rendu()" [attr.seed]="graine()" [question]="questionDemo"></fp-vote>
    }
    @if (etat() === 'erreur') {
      <p data-testid="cours-erreur" i18n="cours.erreur|@@coursErreur">
        Ce cours n'a pas pu être chargé. Rechargez la page ; si le problème persiste, prévenez votre
        formateur.
      </p>
    }
  `,
})
export class CoursHostComponent {
  readonly etat = signal<EtatHote>('chargement');
  readonly rendu = signal<'stage' | 'hand' | 'board'>('hand');
  readonly graine = signal(0);
  readonly sansMemoire = signal(false);
  readonly identiteRefusee = signal(false);
  readonly questionDemo: VoteQuestionPublique = QUESTION_DEMO;

  constructor() {
    afterNextRender(() => {
      void this.demarrer();
    });
  }

  protected enregistrer(evenement: Event): void {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget as HTMLFormElement;
    void this.enregistrerIdentite(new FormData(formulaire));
  }

  private async demarrer(): Promise<void> {
    try {
      const { registerCoursBlocks } = await import('../../../cours/runtime/core/register');
      await registerCoursBlocks();
      const { readIdentity } = await import('../../../cours/runtime/core/identity');
      const identite = readIdentity();
      if (identite === null) {
        this.etat.set('identite');
        return;
      }
      await this.semerDepuis(identite.studentKey);
      this.etat.set('pret');
    } catch {
      this.etat.set('erreur');
    }
  }

  private async enregistrerIdentite(donnees: FormData): Promise<void> {
    let enregistrement: IdentityRegistration;
    try {
      const { saveIdentity } = await import('../../../cours/runtime/core/identity');
      enregistrement = saveIdentity({
        prenom: String(donnees.get('prenom') ?? ''),
        nom: String(donnees.get('nom') ?? ''),
        email: String(donnees.get('email') ?? ''),
      });
    } catch {
      this.identiteRefusee.set(true);
      this.etat.set('identite');
      return;
    }
    this.identiteRefusee.set(false);
    this.sansMemoire.set(!enregistrement.persistee);
    try {
      await this.semerDepuis(enregistrement.identite.studentKey);
      this.etat.set('pret');
    } catch {
      this.etat.set('erreur');
    }
  }

  private async semerDepuis(studentKey: string): Promise<void> {
    const { seedFromKey } = await import('../../../cours/runtime/core/seed');
    this.graine.set(seedFromKey(studentKey));
  }
}
