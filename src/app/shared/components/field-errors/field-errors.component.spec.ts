import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ValidationErrors } from '@angular/forms';
import { REGLE_ATTENDUE_DU_MOT_DE_PASSE as REGLE_ATTENDUE } from '../../../../testing/champ-de-formulaire';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { LONGUEUR_MIN_D_UN_MOT_DE_PASSE } from '../../utils/regles-de-saisie';
import { FieldErrorsComponent } from './field-errors.component';

@Component({
  standalone: true,
  imports: [FieldErrorsComponent],
  template: `<p
    appFieldErrors
    class="erreur"
    [errors]="erreurs()"
    [email]="email()"
    [phone]="telephone()"
    [motDePasse]="motDePasse()"
  ></p>`,
})
class HoteErreursComponent {
  readonly erreurs = signal<ValidationErrors | null>(null);
  readonly email = signal(true);
  readonly telephone = signal(false);
  readonly motDePasse = signal(false);
}

describe('FieldErrorsComponent', () => {
  beforeEach(() => {
    setupTestBed({ http: false, imports: [HoteErreursComponent] });
  });

  function rendre(
    erreurs: ValidationErrors | null,
    options: { email?: boolean; telephone?: boolean; motDePasse?: boolean } = {},
  ): HTMLParagraphElement {
    const fixture = TestBed.createComponent(HoteErreursComponent);
    fixture.componentInstance.erreurs.set(erreurs);
    fixture.componentInstance.email.set(options.email ?? true);
    fixture.componentInstance.telephone.set(options.telephone ?? false);
    fixture.componentInstance.motDePasse.set(options.motDePasse ?? false);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('p.erreur') as HTMLParagraphElement;
  }

  const tropCourt = (requiredLength: number): ValidationErrors => ({
    minlength: { requiredLength, actualLength: 1 },
  });
  const tropLong = (requiredLength: number): ValidationErrors => ({
    maxlength: { requiredLength, actualLength: requiredLength + 1 },
  });
  const horsMotif = { pattern: { requiredPattern: '^x$', actualValue: 'y' } };

  it('rend le message dans le paragraphe hote, sans element englobant', () => {
    const paragraphe = rendre({ required: true });

    expect(paragraphe.children.length).toBe(1);
    expect(paragraphe.firstElementChild?.tagName).toBe('SPAN');
    expect(paragraphe.textContent?.trim()).toBe('Ce champ est obligatoire.');
  });

  it('fait primer le champ obligatoire sur le format', () => {
    expect(rendre({ required: true, email: true }).textContent?.trim()).toBe(
      'Ce champ est obligatoire.',
    );
  });

  it('signale un email invalide quand le format email est attendu', () => {
    expect(rendre({ email: true }).textContent?.trim()).toBe(
      'Merci d’entrer une adresse email valide.',
    );
  });

  it('signale un telephone invalide quand le format telephone est attendu', () => {
    expect(rendre({ phone: true }, { email: false, telephone: true }).textContent?.trim()).toBe(
      'Merci d’entrer un numéro de téléphone valide.',
    );
  });

  it('nomme la règle entière du back, minimum lu de la constante, pour un mot de passe trop court ou hors motif', () => {
    for (const erreurs of [tropCourt(LONGUEUR_MIN_D_UN_MOT_DE_PASSE), horsMotif]) {
      expect(rendre(erreurs, { motDePasse: true }).textContent?.trim())
        .withContext(Object.keys(erreurs)[0])
        .toBe(REGLE_ATTENDUE);
    }
  });

  it('fait primer le format email sur la longueur', () => {
    expect(
      rendre({ email: true, ...tropCourt(12) }, { motDePasse: true }).textContent?.trim(),
    ).toBe('Merci d’entrer une adresse email valide.');
  });

  it('nomme le minimum requis d un champ trop court', () => {
    expect(rendre(tropCourt(10)).textContent?.trim()).toBe(
      'Ce champ doit contenir au moins 10 caractères.',
    );
  });

  it('nomme le maximum permis d un champ trop long, mot de passe compris', () => {
    for (const motDePasse of [false, true]) {
      expect(rendre(tropLong(50), { motDePasse }).textContent?.trim())
        .withContext(`mot de passe : ${motDePasse}`)
        .toBe('Ce champ doit contenir au plus 50 caractères.');
    }
  });

  for (const [format, erreurs, options] of [
    ['mot de passe', horsMotif, {}],
    ['telephone', { phone: true }, {}],
    ['email', { email: true }, { email: false }],
  ] as const) {
    it(`retombe sur le message generique pour un format ${format} non attendu`, () => {
      expect(rendre(erreurs, options).textContent?.trim()).toBe('Valeur invalide.');
    });
  }
});
