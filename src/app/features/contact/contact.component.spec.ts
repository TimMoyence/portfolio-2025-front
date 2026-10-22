import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { CONTACT_PORT, type ContactPort } from '../../core/ports/contact.port';
import { ContactComponent } from './contact.component';
import { erreursApresSaisie, texteDuBlocDuChamp } from '../../../testing/champ-de-formulaire';
import { createContactPortStubWithDefault } from '../../../testing/factories/contact.factory';
import { refusDuBack } from '../../../testing/factories/probleme-http.factory';
import { fournirLaRoute } from '../../../testing/factories/route.factory';
import { champsAntiRobotDeChaqueSaisie, SAISIES_MESUREES } from '../../../testing/saisies-mesurees';
import { pageMontee } from '../../../testing/montage-page';
import { formulaireSoumis } from '../../../testing/page-auth';
import { setupTestBed } from '../../../testing/setup-test-bed';

function soumettreAvecLesConditions(composant: ContactComponent): void {
  composant.contactForm = { ...composant.contactForm, terms: true };
  composant.handleContactSubmit(formulaireSoumis());
}

describe('ContactComponent', () => {
  const page = pageMontee(ContactComponent, {
    providers: [{ provide: CONTACT_PORT, useFactory: createContactPortStubWithDefault }],
  });

  it('should create', () => {
    expect(page.composant).toBeTruthy();
  });

  it('n envoie rien tant que les conditions ne sont pas acceptees, et envoie terms à true ensuite', () => {
    const port = TestBed.inject(CONTACT_PORT) as jasmine.SpyObj<ContactPort>;

    page.composant.handleContactSubmit(formulaireSoumis());
    expect(port.contact).not.toHaveBeenCalled();

    soumettreAvecLesConditions(page.composant);
    expect(port.contact.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ terms: true, termsAcceptedAt: jasmine.any(String) }),
    );
  });

  it('envoie la langue du site, sans sa région, comme langue d acceptation des conditions', () => {
    const port = TestBed.inject(CONTACT_PORT) as jasmine.SpyObj<ContactPort>;

    soumettreAvecLesConditions(page.composant);

    expect(port.contact.calls.mostRecent().args[0].termsLocale).toBe('en');
  });

  it('envoie la durée de chaque saisie, mesurée sur l horloge monotone, sans heure de début', () => {
    const port = TestBed.inject(CONTACT_PORT) as jasmine.SpyObj<ContactPort>;
    const champs = champsAntiRobotDeChaqueSaisie(
      ContactComponent,
      soumettreAvecLesConditions,
      port.contact,
    );

    expect(champs).toEqual(SAISIES_MESUREES);
  });

  it('envoie null pour un téléphone blanc et le téléphone renseigné sans ses espaces', () => {
    const port = TestBed.inject(CONTACT_PORT) as jasmine.SpyObj<ContactPort>;
    for (const phone of ['   ', '  +33 6 12 34 56 78  ']) {
      page.composant.contactForm = { ...page.composant.contactForm, phone };
      soumettreAvecLesConditions(page.composant);
    }

    expect(port.contact.calls.allArgs().map(([demande]) => demande.phone)).toEqual([
      null,
      '+33 6 12 34 56 78',
    ]);
  });

  describe('bornes du DTO de contact du back', () => {
    const saisir = (selecteur: string, valeur: string) =>
      erreursApresSaisie(page.fixture, selecteur, valeur);

    it('plafonne le prénom et le nom à 50 caractères', async () => {
      for (const selecteur of ['#firstName', '#lastName']) {
        expect(await saisir(selecteur, 'a'.repeat(51)))
          .withContext(selecteur)
          .toEqual({ maxlength: { requiredLength: 50, actualLength: 51 } });
        expect(await saisir(selecteur, 'a'.repeat(50))).toBeNull();
      }
    });

    it('refuse une adresse que le back refuse', async () => {
      expect(await saisir('#email', 'jean@gmail')).toEqual({ email: true });
      expect(await saisir('#email', 'jean@exemple.fr')).toBeNull();
    });

    it('borne le message entre 10 et 2000 caractères, et nomme le minimum sous le champ', async () => {
      expect(await saisir('#message', 'a'.repeat(9))).toEqual({
        minlength: { requiredLength: 10, actualLength: 9 },
      });
      expect(texteDuBlocDuChamp(page.fixture, '#message')).toContain(
        'Ce champ doit contenir au moins 10 caractères.',
      );
      expect(await saisir('#message', 'a'.repeat(2001))).toEqual({
        maxlength: { requiredLength: 2000, actualLength: 2001 },
      });
      expect(await saisir('#message', 'a'.repeat(2000))).toBeNull();
    });

    it('juge le prénom, le nom et le message rognés et comptés en caractères, comme le back', async () => {
      const sourire = String.fromCodePoint(0x1f600);
      const mainsJointes = String.fromCodePoint(0x1f64f);
      for (const selecteur of ['#firstName', '#lastName']) {
        expect(await saisir(selecteur, '   '))
          .withContext(selecteur)
          .toEqual({ required: true });
        expect(await saisir(selecteur, sourire.repeat(50)))
          .withContext(selecteur)
          .toBeNull();
      }
      expect(await saisir('#message', 'Bonjour   ')).toEqual({
        minlength: { requiredLength: 10, actualLength: 7 },
      });
      expect(await saisir('#message', `Merci ${mainsJointes}${mainsJointes}`)).toEqual({
        minlength: { requiredLength: 10, actualLength: 8 },
      });
      expect(await saisir('#message', sourire.repeat(2000))).toBeNull();
    });

    it('refuse un téléphone que le back refuse, et le dit sous le champ', async () => {
      expect(await saisir('#phone', '06 98 a0 32 82')).toEqual({ phone: true });
      expect(texteDuBlocDuChamp(page.fixture, '#phone')).toContain(
        'Merci d’entrer un numéro de téléphone valide.',
      );
      expect(await saisir('#phone', '06 98 40 32 82')).toBeNull();
    });
  });

  describe('envoi', () => {
    const envoiEnCours = () =>
      page.racine.querySelector('form button[type="submit"]')?.getAttribute('aria-busy');

    for (const [cas, erreur, attendu] of [
      [
        'un refus du DTO ou de l anti-robot (400)',
        refusDuBack(400, ['message must be longer than or equal to 10 characters']),
        'Votre message n’a pas été accepté : vérifiez les champs et réessayez.',
      ],
      [
        'la limite horaire (429)',
        refusDuBack(429, 'ThrottlerException: Too Many Requests', { 'Retry-After': '45' }),
        'Trop de tentatives en peu de temps : réessayez dans 1 min.',
      ],
      [
        'un back injoignable',
        new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' }),
        'Une erreur est survenue. Veuillez réessayer plus tard.',
      ],
    ] as const) {
      it(`dit ${cas} par un message localisé et rend le bouton`, () => {
        const port = TestBed.inject(CONTACT_PORT) as jasmine.SpyObj<ContactPort>;
        port.contact.and.returnValue(throwError(() => erreur));

        soumettreAvecLesConditions(page.composant);
        page.fixture.detectChanges();

        expect(page.composant.contactErrorMessage).toBe(attendu);
        expect(page.racine.textContent).toContain(attendu);
        expect(envoiEnCours()).toBe('false');
      });
    }

    it('dit le succès par son propre texte sur toute réponse 2xx, et rend le bouton', () => {
      soumettreAvecLesConditions(page.composant);
      page.fixture.detectChanges();

      expect(page.composant.contactErrorMessage).toBeUndefined();
      expect(page.racine.textContent).toContain('Message envoyé. Je reviens vers vous rapidement.');
      expect(envoiEnCours()).toBe('false');
    });
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
        fournirLaRoute({ requete: { reason: 'access', app } }),
      ],
    });
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
    return fixture.componentInstance.contactForm.message;
  };

  it('nomme l espace formateur pour le role teacher', () => {
    expect(messagePour('teacher')).toContain("l'espace formateur");
  });

  it('pre-remplit un sujet que la liste propose, pour que le select l affiche', async () => {
    messagePour('teacher');
    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      'select#subject',
    );
    expect(select?.selectedOptions[0]?.textContent?.trim()).toBe("Demande d'accès application");
  });

  it('nomme une application inconnue sans la presenter comme un atelier', () => {
    const message = messagePour('inconnue');

    expect(message).toContain("l'application inconnue");
    expect(message).not.toContain('atelier');
  });
});
