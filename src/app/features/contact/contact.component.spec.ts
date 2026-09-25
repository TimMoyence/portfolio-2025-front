import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CONTACT_PORT } from '../../core/ports/contact.port';
import { ContactComponent } from './contact.component';
import { createContactPortStubWithDefault } from '../../../testing/factories/contact.factory';
import { pageMontee } from '../../../testing/montage-page';
import { setupTestBed } from '../../../testing/setup-test-bed';

describe('ContactComponent', () => {
  const page = pageMontee(ContactComponent, {
    providers: [{ provide: CONTACT_PORT, useFactory: createContactPortStubWithDefault }],
  });

  it('should create', () => {
    expect(page.composant).toBeTruthy();
  });

  it('should render main title', () => {
    const heading = page.racine.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain(page.composant.hero.title);
  });

  it('devrait afficher le formulaire de contact avec les champs texte', () => {
    const form = page.racine.querySelector('form');
    expect(form).not.toBeNull();

    const inputs = form?.querySelectorAll('input:not([type=radio]):not([type=checkbox])');
    expect(inputs?.length).toBeGreaterThanOrEqual(page.composant.contactFields.length);

    for (const field of page.composant.contactFields) {
      const input = page.racine.querySelector(`#${field.key}`);
      expect(input).withContext(`champ ${field.key} attendu`).not.toBeNull();
    }
  });

  it('devrait afficher le selecteur de sujet', () => {
    const subjectSelect = page.racine.querySelector('select[name="subject"]');
    expect(subjectSelect).not.toBeNull();

    const options = subjectSelect?.querySelectorAll('option');
    expect(options?.length).toBeGreaterThanOrEqual(4);
  });

  it('devrait afficher les boutons radio de role', () => {
    const roleRadios = page.racine.querySelectorAll('input[name="role"]');
    expect(roleRadios.length).toBe(page.composant.contactInfo.roles.length);
  });

  it('devrait afficher le champ message (textarea)', () => {
    expect(page.racine.querySelector('textarea[name="message"]')).not.toBeNull();
  });

  it('devrait afficher la case a cocher des conditions', () => {
    expect(page.racine.querySelector('input[name="terms"][type="checkbox"]')).not.toBeNull();
  });

  it("devrait afficher le bouton d'envoi", () => {
    expect(page.racine.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('devrait initialiser le formulaire avec isContactLoading a false', () => {
    expect(page.composant.isContactLoading).toBeFalse();
    expect(page.composant.isContactSubmitted).toBeFalse();
  });

  it('devrait initialiser le formulaire avec les champs vides', () => {
    const { contactForm } = page.composant;
    expect(contactForm.email).toBe('');
    expect(contactForm.firstName).toBe('');
    expect(contactForm.message).toBe('');
    expect(contactForm.terms).toBeFalse();
  });

  // Contraste mesuré sur le fond de particules qu'un champ transparent laisse
  // voir : `--text-mute` y donne 3,53:1, sous le minimum 4,5:1 de WCAG 2.1 pour
  // du texte normal. La valeur choisie doit donc passer en couleur pleine ; le
  // placeholder est seulement contraint à ne pas l'être, sa teinte restant un
  // point ouvert.
  it('devrait afficher la valeur du sujet en couleur pleine et le placeholder en attenue', () => {
    const { composant, fixture } = page;
    const select = page.racine.querySelector('select[name="subject"]') as HTMLSelectElement;

    expect(select.classList.contains('text-scheme-text')).toBeFalse();

    composant.contactForm = {
      ...composant.contactForm,
      subject: composant.contactInfo.subjects[0],
    };
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(select.classList.contains('text-scheme-text')).toBeTrue();
    expect(select.classList.contains('text-scheme-text-muted')).toBeFalse();
  });

  it('devrait afficher les libelles de champs en couleur pleine, y compris au repos', () => {
    const labelledIds = [
      ...page.composant.contactFields.map((field) => field.key),
      'message',
      'subject',
    ];

    for (const id of labelledIds) {
      const label = page.racine.querySelector(`label[for="${id}"]`);
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
    const groupLabel = page.racine.querySelector('fieldset')?.previousElementSibling;

    expect(groupLabel).not.toBeNull();
    expect(groupLabel?.classList.contains('text-scheme-text')).toBeTrue();
    expect(groupLabel?.classList.contains('text-scheme-text-muted')).toBeFalse();
  });

  it('devrait afficher les libelles de role en couleur pleine', () => {
    const roleLabels = page.racine.querySelectorAll('fieldset label p');

    expect(roleLabels.length).toBe(page.composant.contactInfo.roles.length);
    for (const roleLabel of Array.from(roleLabels)) {
      expect(roleLabel.classList.contains('text-scheme-text'))
        .withContext(`role « ${roleLabel.textContent?.trim()} »`)
        .toBeTrue();
      expect(roleLabel.classList.contains('text-scheme-text-muted')).toBeFalse();
    }
  });
});

describe('ContactComponent — demande d acces redirigee par le garde de role', () => {
  const messagePour = (app: string): string => {
    setupTestBed({
      router: true,
      imports: [ContactComponent],
      providers: [
        { provide: CONTACT_PORT, useValue: createContactPortStubWithDefault() },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ reason: 'access', app }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
    return fixture.componentInstance.contactForm.message;
  };

  it('nomme l espace formateur pour le role teacher', () => {
    expect(messagePour('teacher')).toContain("l'espace formateur");
  });

  it('nomme une application inconnue sans la presenter comme un atelier', () => {
    const message = messagePour('inconnue');

    expect(message).toContain("l'application inconnue");
    expect(message).not.toContain('atelier');
  });
});
