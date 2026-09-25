import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ValidationErrors } from '@angular/forms';
import { setupTestBed } from '../../../../testing/setup-test-bed';
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
    [longueur]="longueur()"
  ></p>`,
})
class HoteErreursComponent {
  readonly erreurs = signal<ValidationErrors | null>(null);
  readonly email = signal(true);
  readonly telephone = signal(false);
  readonly longueur = signal(false);
}

describe('FieldErrorsComponent', () => {
  function rendre(
    erreurs: ValidationErrors | null,
    options: { email?: boolean; telephone?: boolean; longueur?: boolean } = {},
  ): HTMLParagraphElement {
    setupTestBed({ http: false, imports: [HoteErreursComponent] });
    const fixture = TestBed.createComponent(HoteErreursComponent);
    fixture.componentInstance.erreurs.set(erreurs);
    fixture.componentInstance.email.set(options.email ?? true);
    fixture.componentInstance.telephone.set(options.telephone ?? false);
    fixture.componentInstance.longueur.set(options.longueur ?? false);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('p.erreur') as HTMLParagraphElement;
  }

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

  it('signale un mot de passe trop court quand la longueur est attendue', () => {
    expect(rendre({ minlength: true }, { longueur: true }).textContent?.trim()).toBe(
      'Le mot de passe doit contenir au moins 8 caractères.',
    );
  });

  it('fait primer le format email sur la longueur', () => {
    expect(rendre({ email: true, minlength: true }, { longueur: true }).textContent?.trim()).toBe(
      'Merci d’entrer une adresse email valide.',
    );
  });

  for (const [format, erreurs, options] of [
    ['longueur', { minlength: true }, {}],
    ['telephone', { phone: true }, {}],
    ['email', { email: true }, { email: false }],
  ] as const) {
    it(`retombe sur le message generique pour un format ${format} non attendu`, () => {
      expect(rendre(erreurs, options).textContent?.trim()).toBe('Valeur invalide.');
    });
  }
});
