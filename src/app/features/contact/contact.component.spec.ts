import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { CONTACT_PORT } from '../../core/ports/contact.port';
import { ContactComponent } from './contact.component';
import { environment } from '../../../environments/environment';
import { createContactPortStubWithDefault } from '../../../testing/factories/contact.factory';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
        {
          provide: CONTACT_PORT,
          useValue: createContactPortStubWithDefault(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain(component.hero.title);
  });

  // --- Presence du formulaire ---

  it('devrait afficher le formulaire de contact avec les champs texte', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector('form');
    expect(form).not.toBeNull();

    // Les 4 champs sont rendus via @for sur contactFields
    const inputs = form?.querySelectorAll('input:not([type=radio]):not([type=checkbox])');
    expect(inputs?.length).toBeGreaterThanOrEqual(component.contactFields.length);

    // Verifie la presence de chaque champ par son id
    for (const field of component.contactFields) {
      const input = compiled.querySelector(`#${field.key}`);
      expect(input).withContext(`champ ${field.key} attendu`).not.toBeNull();
    }
  });

  it('devrait afficher le selecteur de sujet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subjectSelect = compiled.querySelector('select[name="subject"]');
    expect(subjectSelect).not.toBeNull();

    // Verifie que les options de sujet sont presentes (+ l'option placeholder)
    const options = subjectSelect?.querySelectorAll('option');
    // 1 placeholder + 3 sujets = 4 options
    expect(options?.length).toBeGreaterThanOrEqual(4);
  });

  it('devrait afficher les boutons radio de role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const roleRadios = compiled.querySelectorAll('input[name="role"]');
    // 6 roles definis dans le composant
    expect(roleRadios.length).toBe(component.contactInfo.roles.length);
  });

  it('devrait afficher le champ message (textarea)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const textarea = compiled.querySelector('textarea[name="message"]');
    expect(textarea).not.toBeNull();
  });

  it('devrait afficher la case a cocher des conditions', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const termsCheckbox = compiled.querySelector('input[name="terms"][type="checkbox"]');
    expect(termsCheckbox).not.toBeNull();
  });

  it("devrait afficher le bouton d'envoi", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('button[type="submit"]');
    expect(submitButton).not.toBeNull();
  });

  // --- Etat initial ---

  it('devrait initialiser le formulaire avec isContactLoading a false', () => {
    expect(component.isContactLoading).toBeFalse();
    expect(component.isContactSubmitted).toBeFalse();
  });

  it('devrait initialiser le formulaire avec les champs vides', () => {
    expect(component.contactForm.email).toBe('');
    expect(component.contactForm.firstName).toBe('');
    expect(component.contactForm.message).toBe('');
    expect(component.contactForm.terms).toBeFalse();
  });

  // --- Contraste (WCAG 2.1 AA) ---
  // Les champs sont transparents : le fond effectif est le champ de particules
  // sous le voile. `--text-mute` y tombe a 3,53:1, sous le seuil AA de 4,5:1.
  // Toute valeur saisie ou selectionnee doit donc s'afficher en `--text-strong`.

  it('devrait afficher la valeur du sujet en couleur pleine et le placeholder en attenue', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const select = compiled.querySelector('select[name="subject"]') as HTMLSelectElement;

    // Aucune valeur : le placeholder doit se distinguer d'une valeur saisie, donc
    // ne pas etre en couleur pleine. On n'affirme PAS qu'il est `--text-mute` :
    // sa teinte reste un point de contraste ouvert (~3,5:1 sur le fond veine),
    // et figer la classe actuelle rendrait rouge toute correction future.
    expect(select.classList.contains('text-scheme-text')).toBeFalse();

    component.contactForm = {
      ...component.contactForm,
      subject: component.contactInfo.subjects[0],
    };
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(select.classList.contains('text-scheme-text')).toBeTrue();
    expect(select.classList.contains('text-scheme-text-muted')).toBeFalse();
  });

  it('devrait afficher les libelles de champs en couleur pleine, y compris au repos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const labelledIds = [
      ...component.contactFields.map((field) => field.key),
      'message',
      'subject',
    ];

    // Formulaire vierge : c'est l'etat « au repos » des labels flottants,
    // ou ils sont la seule indication de ce qu'il faut saisir.
    for (const id of labelledIds) {
      const label = compiled.querySelector(`label[for="${id}"]`);
      expect(label).withContext(`label du champ ${id}`).not.toBeNull();
      expect(label?.classList.contains('text-scheme-text'))
        .withContext(`label du champ ${id}`)
        .toBeTrue();
      expect(label?.classList.contains('text-scheme-text-muted'))
        .withContext(`label du champ ${id}`)
        .toBeFalse();
      // La variante `peer-placeholder-shown:` est plus specifique que la classe
      // posee par [ngClass] : si elle reste attenuee, elle gagne au repos.
      // Le nom est reconstitue par concatenation : Tailwind scanne aussi les
      // `.spec.ts` (tailwind.config.js `content`), et le litteral entier
      // suffirait a garder vivante dans le CSS de production l'utilitaire que
      // ce test verifie justement comme absent.
      const varianteAttenuee = `peer-placeholder-shown:${'text-scheme-text-muted'}`;
      expect(label?.classList.contains(varianteAttenuee))
        .withContext(`label du champ ${id}`)
        .toBeFalse();
    }
  });

  it('devrait afficher le libelle du groupe de roles en couleur pleine', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const groupLabel = compiled.querySelector('fieldset')?.previousElementSibling;

    expect(groupLabel).not.toBeNull();
    expect(groupLabel?.classList.contains('text-scheme-text')).toBeTrue();
    expect(groupLabel?.classList.contains('text-scheme-text-muted')).toBeFalse();
  });

  it('devrait afficher les libelles de role en couleur pleine', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const roleLabels = compiled.querySelectorAll('fieldset label p');

    expect(roleLabels.length).toBe(component.contactInfo.roles.length);
    for (const roleLabel of Array.from(roleLabels)) {
      expect(roleLabel.classList.contains('text-scheme-text'))
        .withContext(`role « ${roleLabel.textContent?.trim()} »`)
        .toBeTrue();
      expect(roleLabel.classList.contains('text-scheme-text-muted')).toBeFalse();
    }
  });
});
