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
});
