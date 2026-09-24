import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LEAD_MAGNET_PORT } from '../../../core/ports/lead-magnet.port';
import {
  createLeadMagnetPortStub,
  createLeadMagnetPortStubWithError,
} from '../../../../testing/factories/lead-magnet.factory';
import { ToolkitFormComponent } from './toolkit-form.component';

async function monter(port: unknown): Promise<ComponentFixture<ToolkitFormComponent>> {
  await TestBed.configureTestingModule({
    imports: [ToolkitFormComponent],
    providers: [{ provide: LEAD_MAGNET_PORT, useValue: port }],
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

  it('transmet le formationSlug en @Input au port.requestToolkit', async () => {
    fixture.componentRef.setInput('formationSlug', 'automatiser-avec-ia');

    await soumettre(fixture);

    expect(portStub.requestToolkit).toHaveBeenCalledTimes(1);
    const payload = portStub.requestToolkit.calls.mostRecent().args[0];
    expect(payload.formationSlug).toBe('automatiser-avec-ia');
    expect(payload.email).toBe('marie@example.com');
    expect(payload.firstName).toBe('Marie');
  });

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

  it("utilise 'ia-solopreneurs' par defaut si aucun formationSlug n'est passe", async () => {
    await soumettre(fixture);

    const payload = portStub.requestToolkit.calls.mostRecent().args[0];
    expect(payload.formationSlug).toBe('ia-solopreneurs');
  });
});
