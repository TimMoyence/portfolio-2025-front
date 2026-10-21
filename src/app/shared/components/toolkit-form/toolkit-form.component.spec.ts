import { HttpErrorResponse } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { aLaPage } from '../../../../testing/chemin-de-la-page';
import { LEAD_MAGNET_PORT } from '../../../core/ports/lead-magnet.port';
import {
  createLeadMagnetPortStub,
  createLeadMagnetPortStubWithError,
} from '../../../../testing/factories/lead-magnet.factory';
import { refusDuBack } from '../../../../testing/factories/probleme-http.factory';
import { champsAntiRobotDe, horlogesDeSaisie } from '../../../../testing/horloge-simulee';
import { ToolkitFormComponent } from './toolkit-form.component';

async function monter(
  port: unknown,
  localeId = 'en-US',
): Promise<ComponentFixture<ToolkitFormComponent>> {
  await TestBed.configureTestingModule({
    imports: [ToolkitFormComponent],
    providers: [
      { provide: LEAD_MAGNET_PORT, useValue: port },
      { provide: LOCALE_ID, useValue: localeId },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ToolkitFormComponent);
  fixture.detectChanges();
  return fixture;
}

function remplir(fixture: ComponentFixture<ToolkitFormComponent>): void {
  fixture.componentInstance.firstName.set('Marie');
  fixture.componentInstance.email.set('marie@example.com');
  fixture.componentInstance.termsAccepted.set(true);
  fixture.detectChanges();
}

async function soumettre(fixture: ComponentFixture<ToolkitFormComponent>): Promise<void> {
  remplir(fixture);
  fixture.componentInstance.onSubmit();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('ToolkitFormComponent', () => {
  let component: ToolkitFormComponent;
  let fixture: ComponentFixture<ToolkitFormComponent>;
  let portStub: ReturnType<typeof createLeadMagnetPortStub>;

  beforeEach(async () => {
    portStub = createLeadMagnetPortStub();
    fixture = await monter(portStub);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render firstName and email inputs', () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      'input[type="text"], input[type="email"]',
    );
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('should render GDPR checkbox', () => {
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeTruthy();
  });

  it('should disable submit when form is invalid', () => {
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();
  });

  it('should enable submit when form is valid', () => {
    remplir(fixture);

    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeFalse();
  });

  it('should call port and show success on valid submit', async () => {
    await soumettre(fixture);

    expect(portStub.requestToolkit).toHaveBeenCalledTimes(1);
    expect(component.state()).toBe('success');
  });

  it("passe en erreur et affiche le bloc erreur (data-toolkit-error) quand l'envoi echoue", async () => {
    TestBed.resetTestingModule();
    const enEchec = await monter(createLeadMagnetPortStubWithError());

    await soumettre(enEchec);

    expect(enEchec.componentInstance.state()).toBe('error');
    expect(enEchec.nativeElement.querySelector('[data-toolkit-error]')).not.toBeNull();
  });

  for (const { localeId, chemin } of [
    { localeId: 'en-US', chemin: '/toolkit' },
    { localeId: 'fr', chemin: '/en/toolkit' },
  ]) {
    it(`transmet la langue de la page, sans sa région, comme langue d acceptation des conditions (LOCALE_ID ${localeId}, ${chemin})`, async () => {
      TestBed.resetTestingModule();
      const sousLaPage = await aLaPage(chemin, () => monter(portStub, localeId));

      await soumettre(sousLaPage);

      expect(portStub.requestToolkit.calls.mostRecent().args[0].termsLocale).toBe('en');
    });
  }

  it("affiche l'email soumis dans le bloc succes (data-toolkit-success)", async () => {
    await soumettre(fixture);

    const successBlock: HTMLElement | null =
      fixture.nativeElement.querySelector('[data-toolkit-success]');
    expect(successBlock).not.toBeNull();
    expect(successBlock?.textContent).toContain('marie@example.com');
  });

  describe("validation de l'email", () => {
    const ACCEPTED = ['marie@example.com', 'a.b+tag@sous.domaine.fr', 'x@y.zz'];
    const REJECTED = [
      'marie',
      'marie@',
      '@example.com',
      'marie@example',
      'marie@@example.com',
      'marie@example..com',
      'marie exemple@example.com',
      'marie@exa mple.com',
      'marie@exemple.c',
      'marie@-exemple.fr',
      'marie..dupont@exemple.fr',
    ];

    function setValidExcept(email: string): void {
      component.firstName.set('Marie');
      component.termsAccepted.set(true);
      component.email.set(email);
    }

    for (const email of ACCEPTED) {
      it(`accepte ${email}`, () => {
        setValidExcept(email);
        expect(component.isValid()).toBeTrue();
      });
    }

    for (const email of REJECTED) {
      it(`refuse ${email}`, () => {
        setValidExcept(email);
        expect(component.isValid()).toBeFalse();
      });
    }
  });

  it('plafonne le prénom rogné à 50 caractères comptés comme le back, et le dit sous le champ', () => {
    const texte = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';
    component.email.set('marie@example.com');
    component.termsAccepted.set(true);

    component.firstName.set(` ${String.fromCodePoint(0x1f600).repeat(50)} `);
    expect(component.isValid()).toBeTrue();

    component.firstName.set('a'.repeat(51));
    fixture.detectChanges();
    expect(component.isValid()).toBeFalse();
    expect(texte()).toContain('Ce champ doit contenir au plus 50 caractères.');

    component.firstName.set('a'.repeat(50));
    fixture.detectChanges();
    expect(component.isValid()).toBeTrue();
    expect(texte()).not.toContain('Ce champ doit contenir au plus 50 caractères.');
  });

  it('dit sous le champ une adresse que le back refuse', () => {
    component.email.set('marie@gmail');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Merci d’entrer une adresse email valide.',
    );
  });

  it('envoie au port le toolkit ia-solopreneurs, le seul que le back connaît, avec la saisie', async () => {
    await soumettre(fixture);

    expect(portStub.requestToolkit).toHaveBeenCalledTimes(1);
    const payload = portStub.requestToolkit.calls.mostRecent().args[0];
    expect(payload.formationSlug).toBe('ia-solopreneurs');
    expect(payload.email).toBe('marie@example.com');
    expect(payload.firstName).toBe('Marie');
  });

  describe('L4-F22 · dit le refus du back par son message, et une erreur réseau par celui du formulaire', () => {
    for (const [cas, erreur, attendu] of [
      [
        'un refus du DTO ou de l anti-robot (400)',
        refusDuBack(400, ['firstName must be shorter than or equal to 50 characters']),
        'Certaines informations ont été refusées : vérifiez les champs et réessayez.',
      ],
      [
        'la limite horaire (429), avec l attente lue dans Retry-After',
        refusDuBack(429, 'ThrottlerException: Too Many Requests', { 'Retry-After': '120' }),
        'Trop de tentatives en peu de temps : réessayez dans 2 min.',
      ],
      [
        'un back injoignable, par le message du formulaire (décision F22 de Tim)',
        new HttpErrorResponse({ status: 0, url: 'https://asilidesign.fr' }),
        'Une erreur est survenue. Réessayez.',
      ],
    ] as const) {
      it(`dit ${cas} et rend le bouton`, async () => {
        TestBed.resetTestingModule();
        const enEchec = await monter(createLeadMagnetPortStubWithError(erreur));

        await soumettre(enEchec);

        const racine = enEchec.nativeElement as HTMLElement;
        expect(enEchec.componentInstance.state()).toBe('error');
        expect(racine.querySelector('[data-toolkit-error]')?.textContent?.trim()).toBe(attendu);
        expect(
          racine.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled,
        ).toBeFalse();
      });
    }
  });

  it('envoie la durée de saisie mesurée sur l horloge monotone, sans heure de début', async () => {
    const horloges = horlogesDeSaisie();
    const fixtureMesuree = TestBed.createComponent(ToolkitFormComponent);

    horloges.saisirPendant(20_000);
    await soumettre(fixtureMesuree);

    expect(champsAntiRobotDe(portStub.requestToolkit.calls.mostRecent().args[0])).toEqual({
      formFillDurationMs: 20_000,
      heureDeDebutEnvoyee: false,
    });
  });
});
