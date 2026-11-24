import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { zContactRequestDto } from '../../../../contrat/zod.gen';
import { CONTACT_PORT, type ContactPort } from '../../core/ports/contact.port';
import { CONTACT_PORT_PAR_DEFAUT } from '../../../testing/factories/contact.factory';
import { formulaireSoumis } from '../../../testing/http/page-auth';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { ContactComponent } from './contact.component';

const BESOINS = [
  'Créer mon site',
  'Refaire mon site',
  'Une app mobile',
  'Un outil sur mesure',
  'Former mon équipe',
  'Un cours BTS / Bachelor',
];

describe('REC-12 · le contact s ouvre sur le besoin du visiteur', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await setupTestBed({
      providers: [
        provideRouter([{ path: 'contact', component: ContactComponent }]),
        CONTACT_PORT_PAR_DEFAUT,
      ],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });

  const ouvrir = async (url: string): Promise<ContactComponent> => {
    const composant = await harness.navigateByUrl(url, ContactComponent);
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
    return composant;
  };

  const racine = (): HTMLElement => harness.routeNativeElement as HTMLElement;

  const selectDuBesoin = (): HTMLSelectElement =>
    racine().querySelector<HTMLSelectElement>('select#besoin')!;

  const optionsDuBesoin = (): string[] =>
    Array.from(selectDuBesoin().options)
      .filter((option) => option.value !== '')
      .map(texte);

  const besoinAffiche = (): string => texte(selectDuBesoin().selectedOptions[0]);

  it('REC-12 · l en-tête dit « Contact » puis « Parlons de votre site »', async () => {
    await ouvrir('/contact');
    const titre = racine().querySelector('h1');

    expect(texte(titre)).toBe('Parlons de votre site');
    expect(texte(titre?.previousElementSibling)).toBe('Contact');
  });

  it('REC-12 · sans paramètre, six besoins dans l ordre, aucun choisi, sans demande d accès', async () => {
    await ouvrir('/contact');

    expect(optionsDuBesoin()).toEqual(BESOINS);
    expect(selectDuBesoin().value).toBe('');
  });

  for (const [besoin, libelle] of [
    ['refaire', 'Refaire mon site'],
    ['sur-mesure', 'Un outil sur mesure'],
    ['app-mobile', 'Une app mobile'],
    ['cours', 'Un cours BTS / Bachelor'],
  ] as const) {
    it(`REC-12 · ?besoin=${besoin} présélectionne « ${libelle} »`, async () => {
      await ouvrir(`/contact?besoin=${besoin}`);

      expect(besoinAffiche()).toBe(libelle);
    });
  }

  for (const valeur of ['CREER', '', 'inconnu', encodeURIComponent('<script>alert(1)</script>')]) {
    it(`REC-12 · ?besoin=${valeur} ne présélectionne rien et n injecte rien`, async () => {
      await ouvrir(`/contact?besoin=${valeur}`);

      expect(selectDuBesoin().value).toBe('');
      expect(optionsDuBesoin()).toEqual(BESOINS);
      expect(racine().querySelector('script')).toBeNull();
      expect(racine().textContent).not.toContain('alert(1)');
    });
  }

  it('REC-12 · seule la première valeur de ?besoin= compte', async () => {
    await ouvrir('/contact?besoin=creer&besoin=app-mobile');

    expect(besoinAffiche()).toBe('Créer mon site');
  });

  it('REC-12 · le lien d accès l emporte sur ?besoin= et préremplit le message', async () => {
    const composant = await ouvrir('/contact?reason=access&app=teacher&besoin=creer');

    expect(besoinAffiche()).toBe("Demande d'accès application");
    expect(optionsDuBesoin()).toEqual([...BESOINS, "Demande d'accès application"]);
    expect(composant.contactForm.message).toContain("l'espace formateur");
  });

  it('REC-12 · un nouveau ?besoin= change le besoin et garde le message saisi', async () => {
    const composant = await ouvrir('/contact?besoin=refaire');
    composant.contactForm = { ...composant.contactForm, message: 'Mon salon a besoin d un site.' };

    await ouvrir('/contact?besoin=creer');

    expect(besoinAffiche()).toBe('Créer mon site');
    expect(composant.contactForm.message).toBe('Mon salon a besoin d un site.');
  });

  it('REC-12 · les champs suivent l ordre besoin, activité, identité, projet, conditions', async () => {
    await ouvrir('/contact');
    const noms = Array.from(
      racine().querySelectorAll<HTMLElement>('form input, form select, form textarea'),
    )
      .map((champ) => champ.getAttribute('name') ?? champ.id)
      .filter((nom) => nom !== 'website');

    expect([...new Set(noms)]).toEqual([
      'besoin',
      'role',
      'firstName',
      'lastName',
      'email',
      'phone',
      'message',
      'terms',
    ]);
    expect(texte(racine().querySelector('label[for="besoin"]'))).toBe('Votre besoin');
    expect(texte(racine().querySelector('fieldset legend'))).toBe('Votre activité');
    expect(texte(racine().querySelector('label[for="message"]'))).toBe('Votre projet');
  });

  it('REC-12 · les activités sont Artisan, Commerce, Indépendant, PME, Association, Autre', async () => {
    await ouvrir('/contact');
    const activites = Array.from(
      racine().querySelectorAll<HTMLInputElement>('input[name="role"]'),
    ).map((radio) => texte(radio.closest('label')));

    expect(activites).toEqual([
      'Artisan',
      'Commerce',
      'Indépendant',
      'PME',
      'Association',
      'Autre',
    ]);
  });

  it('REC-12 · l envoi porte le libellé du besoin et de l activité, dans la forme du DTO', async () => {
    const composant = await ouvrir('/contact?besoin=creer');
    const port = TestBed.inject(CONTACT_PORT) as jasmine.SpyObj<ContactPort>;
    composant.contactForm = {
      ...composant.contactForm,
      role: 'Artisan',
      firstName: 'Léa',
      lastName: 'Martin',
      email: 'lea@exemple.fr',
      message: 'Un site pour ma boulangerie.',
      terms: true,
    };

    composant.handleContactSubmit(formulaireSoumis());
    const envoi = port.contact.calls.mostRecent().args[0];

    expect(envoi.subject).toBe('Créer mon site');
    expect(envoi.role).toBe('Artisan');
    expect(zContactRequestDto.strict().safeParse(envoi).success).toBeTrue();
  });

  it('REC-12 · après un envoi réussi, le formulaire se vide, besoin compris', async () => {
    const composant = await ouvrir('/contact?besoin=refaire');
    composant.contactForm = {
      ...composant.contactForm,
      role: 'Commerce',
      firstName: 'Léa',
      lastName: 'Martin',
      email: 'lea@exemple.fr',
      message: 'Refaire le site de ma boutique.',
      terms: true,
    };

    composant.handleContactSubmit(formulaireSoumis());
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(selectDuBesoin().value).toBe('');
    expect(composant.contactForm.message).toBe('');
  });

  it('REC-12 · le délai se dit « 48 h ouvrées », partout sur la page', async () => {
    await ouvrir('/contact');
    const page = texte(racine());

    expect(page).toContain('Réponse sous 48 h ouvrées');
    expect(page).not.toMatch(/48h/);
    expect(page).not.toMatch(/48 h(?! ouvrées)/);
  });
});
