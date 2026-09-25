import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormsModule, type NgForm } from '@angular/forms';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { FormulaireAuthComponent } from './formulaire-auth.component';

@Component({
  standalone: true,
  imports: [FormsModule, FormulaireAuthComponent],
  template: `
    <form
      #formRef="ngForm"
      (ngSubmit)="soumissions.push(formRef)"
      [authEnCours]="enCours()"
      [authBloque]="bloque()"
      [authErreur]="erreur()"
    >
      <input name="email" required [(ngModel)]="email" />
      <span ngProjectAs="[libelleEnvoi]" class="envoi-probe">Envoyer</span>
      <span ngProjectAs="[libelleAttente]" class="attente-probe">Envoi...</span>
    </form>
  `,
})
class HoteFormulaireComponent {
  readonly enCours = signal(false);
  readonly bloque = signal(false);
  readonly erreur = signal<string | undefined>(undefined);
  readonly soumissions: NgForm[] = [];
  email = '';
}

describe('FormulaireAuthComponent', () => {
  let fixture: ComponentFixture<HoteFormulaireComponent>;

  const racine = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const bouton = (): HTMLButtonElement =>
    racine().querySelector('form > button[type="submit"]') as HTMLButtonElement;

  beforeEach(async () => {
    await setupTestBed({ http: false, imports: [HoteFormulaireComponent] }).compileComponents();
    fixture = TestBed.createComponent(HoteFormulaireComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('place les champs projetes, puis le bouton d envoi et la zone d erreur dans le formulaire', () => {
    const enfants = Array.from(racine().querySelector('form')?.children ?? []).map(
      (enfant) => enfant.localName,
    );

    expect(enfants).toEqual(['input', 'button', 'app-auth-erreur']);
    expect(bouton().className).toBe('btn btn-teal auth-submit');
  });

  it('affiche le libelle d envoi et la fleche hors chargement', () => {
    expect(bouton().querySelector('.envoi-probe')).not.toBeNull();
    expect(bouton().querySelector('.arrow')?.getAttribute('aria-hidden')).toBe('true');
    expect(bouton().querySelector('.attente-probe')).toBeNull();
    expect(bouton().disabled).toBeFalse();
    expect(bouton().getAttribute('aria-busy')).toBe('false');
  });

  it('affiche le libelle d attente, sans fleche, et desactive le bouton pendant l envoi', () => {
    fixture.componentInstance.enCours.set(true);
    fixture.detectChanges();

    expect(bouton().querySelector('.attente-probe')).not.toBeNull();
    expect(bouton().querySelector('.envoi-probe')).toBeNull();
    expect(bouton().querySelector('.arrow')).toBeNull();
    expect(bouton().disabled).toBeTrue();
    expect(bouton().getAttribute('aria-busy')).toBe('true');
  });

  it('desactive le bouton quand l envoi est bloque, sans le marquer occupe', () => {
    fixture.componentInstance.bloque.set(true);
    fixture.detectChanges();

    expect(bouton().disabled).toBeTrue();
    expect(bouton().getAttribute('aria-busy')).toBe('false');
  });

  it('affiche l erreur transmise', () => {
    fixture.componentInstance.erreur.set('Lien invalide');
    fixture.detectChanges();

    expect(racine().querySelector('app-auth-erreur .auth-msg.err')?.textContent?.trim()).toBe(
      'Lien invalide',
    );
  });

  it('rattache les champs projetes au formulaire de la page', () => {
    bouton().click();

    const [formulaire] = fixture.componentInstance.soumissions;
    expect(formulaire.invalid).toBeTrue();
    expect(formulaire.controls['email']).toBeDefined();
  });
});
