import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  signal,
} from '@angular/core';
import type { VoteQuestion } from '../../../cours/runtime/blocks/FpVote';

type EtatHote = 'chargement' | 'identite' | 'pret' | 'erreur';

const QUESTION_DEMO: VoteQuestion = {
  id: 'Q-CAP-03',
  enonce: 'Un capital de 1 000 € placé à 4 % pendant 10 ans (intérêts composés) vaut environ :',
  options: [
    {
      id: 'a',
      libelle: '1 400 €',
      misconception: 'Confond intérêts composés et intérêts simples',
    },
    { id: 'b', libelle: '1 480,24 €', misconception: null },
    {
      id: 'c',
      libelle: '10 400 €',
      misconception: 'Multiplie le taux par la durée au lieu d’élever à la puissance',
    },
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
      </form>
    }
    @if (etat() === 'pret') {
      <fp-vote [attr.render]="rendu()" [attr.seed]="graine()" [question]="questionDemo"></fp-vote>
    }
    @if (etat() === 'erreur') {
      <p data-testid="cours-erreur" i18n="cours.erreur|@@coursErreur">
        Ce cours n'a pas pu être chargé.
      </p>
    }
  `,
})
export class CoursHostComponent {
  readonly etat = signal<EtatHote>('chargement');
  readonly rendu = signal<'stage' | 'hand' | 'board'>('hand');
  readonly graine = signal(0);
  readonly questionDemo: VoteQuestion = QUESTION_DEMO;

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
      this.etat.set(readIdentity() ? 'pret' : 'identite');
    } catch {
      this.etat.set('erreur');
    }
  }

  private async enregistrerIdentite(donnees: FormData): Promise<void> {
    try {
      const { saveIdentity } = await import('../../../cours/runtime/core/identity');
      saveIdentity({
        prenom: String(donnees.get('prenom') ?? ''),
        nom: String(donnees.get('nom') ?? ''),
        email: String(donnees.get('email') ?? ''),
      });
      this.etat.set('pret');
    } catch {
      this.etat.set('erreur');
    }
  }
}
