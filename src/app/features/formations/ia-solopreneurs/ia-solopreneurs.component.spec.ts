import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { APP_CONFIG } from "../../../core/config/app-config.token";
import { LEAD_MAGNET_PORT } from "../../../core/ports/lead-magnet.port";
import { buildAppConfig } from "../../../../testing/factories/app-config.factory";
import { createLeadMagnetPortStub } from "../../../../testing/factories/lead-magnet.factory";
import { IaSolopreneursComponent } from "./ia-solopreneurs.component";
import { IA_SOLOPRENEURS_SLIDES } from "./ia-solopreneurs.data";

describe("IaSolopreneursComponent", () => {
  let component: IaSolopreneursComponent;
  let fixture: ComponentFixture<IaSolopreneursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IaSolopreneursComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: buildAppConfig() },
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IaSolopreneursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait exposer les slides de la presentation IA solopreneurs", () => {
    expect(component.slides).toBe(IA_SOLOPRENEURS_SLIDES);
    expect(component.slides.length).toBeGreaterThan(0);
  });

  it("devrait rendre le composant presentation-engine", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const engine = compiled.querySelector("app-presentation-engine");
    expect(engine).not.toBeNull();
  });
});
