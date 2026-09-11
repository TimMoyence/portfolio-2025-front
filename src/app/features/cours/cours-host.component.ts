import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  signal,
} from '@angular/core';

type EtatHote = 'chargement' | 'identite' | 'pret' | 'erreur';

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
      <fp-vote [attr.render]="rendu()" [attr.seed]="graine()"></fp-vote>
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
