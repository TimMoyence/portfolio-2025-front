import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LEAD_MAGNET_PORT } from "../../../core/ports/lead-magnet.port";
import {
  createLeadMagnetPortStub,
  createLeadMagnetPortStubWithError,
} from "../../../../testing/factories/lead-magnet.factory";
import { ToolkitFormComponent } from "./toolkit-form.component";

describe("ToolkitFormComponent", () => {
  let component: ToolkitFormComponent;
  let fixture: ComponentFixture<ToolkitFormComponent>;
  let portStub: ReturnType<typeof createLeadMagnetPortStub>;

  beforeEach(async () => {
    portStub = createLeadMagnetPortStub();

    await TestBed.configureTestingModule({
      imports: [ToolkitFormComponent],
      providers: [{ provide: LEAD_MAGNET_PORT, useValue: portStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolkitFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render firstName and email inputs", () => {
    const inputs = fixture.nativeElement.querySelectorAll(
      'input[type="text"], input[type="email"]',
    );
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("should render GDPR checkbox", () => {
    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    );
    expect(checkbox).toBeTruthy();
  });

  it("should disable submit when form is invalid", () => {
    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();
  });

  it("should enable submit when form is valid", () => {
    component.firstName.set("Marie");
    component.email.set("marie@example.com");
    component.termsAccepted.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeFalse();
  });

  it("should call port and show success on valid submit", async () => {
    component.firstName.set("Marie");
    component.email.set("marie@example.com");
    component.termsAccepted.set(true);
    fixture.detectChanges();

    component.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(portStub.requestToolkit).toHaveBeenCalledTimes(1);
    expect(component.state()).toBe("success");
  });

  it("should show error state on failure", async () => {
    const errorPort = createLeadMagnetPortStubWithError();

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolkitFormComponent],
      providers: [{ provide: LEAD_MAGNET_PORT, useValue: errorPort }],
    }).compileComponents();

    const errorFixture = TestBed.createComponent(ToolkitFormComponent);
    const errorComponent = errorFixture.componentInstance;
    errorFixture.detectChanges();

    errorComponent.firstName.set("Marie");
    errorComponent.email.set("marie@example.com");
    errorComponent.termsAccepted.set(true);
    errorFixture.detectChanges();

    errorComponent.onSubmit();
    await errorFixture.whenStable();
    errorFixture.detectChanges();

    expect(errorComponent.state()).toBe("error");
  });

  it("transmet le formationSlug en @Input au port.requestToolkit", async () => {
    fixture.componentRef.setInput("formationSlug", "automatiser-avec-ia");
    component.firstName.set("Marie");
    component.email.set("marie@example.com");
    component.termsAccepted.set(true);
    fixture.detectChanges();

    component.onSubmit();
    await fixture.whenStable();

    expect(portStub.requestToolkit).toHaveBeenCalledTimes(1);
    const payload = portStub.requestToolkit.calls.mostRecent().args[0];
    expect(payload.formationSlug).toBe("automatiser-avec-ia");
    expect(payload.email).toBe("marie@example.com");
    expect(payload.firstName).toBe("Marie");
  });

  it("affiche l'email soumis dans le bloc succes (data-toolkit-success)", async () => {
    component.firstName.set("Marie");
    component.email.set("marie@example.com");
    component.termsAccepted.set(true);
    fixture.detectChanges();
    component.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();

    const successBlock: HTMLElement | null =
      fixture.nativeElement.querySelector("[data-toolkit-success]");
    expect(successBlock).not.toBeNull();
    expect(successBlock?.textContent).toContain("marie@example.com");
  });

  it("affiche le bloc erreur (data-toolkit-error) quand l'envoi echoue", async () => {
    const errorPort = createLeadMagnetPortStubWithError();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ToolkitFormComponent],
      providers: [{ provide: LEAD_MAGNET_PORT, useValue: errorPort }],
    }).compileComponents();

    const f = TestBed.createComponent(ToolkitFormComponent);
    f.detectChanges();
    f.componentInstance.firstName.set("Marie");
    f.componentInstance.email.set("marie@example.com");
    f.componentInstance.termsAccepted.set(true);
    f.detectChanges();
    f.componentInstance.onSubmit();
    await f.whenStable();
    f.detectChanges();

    const errorBlock = f.nativeElement.querySelector("[data-toolkit-error]");
    expect(errorBlock).not.toBeNull();
  });

  it("utilise 'ia-solopreneurs' par defaut si aucun formationSlug n'est passe", async () => {
    component.firstName.set("Marie");
    component.email.set("marie@example.com");
    component.termsAccepted.set(true);
    fixture.detectChanges();
    component.onSubmit();
    await fixture.whenStable();

    const payload = portStub.requestToolkit.calls.mostRecent().args[0];
    expect(payload.formationSlug).toBe("ia-solopreneurs");
  });
});
