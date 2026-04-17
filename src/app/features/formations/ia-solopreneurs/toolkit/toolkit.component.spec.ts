import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { LEAD_MAGNET_PORT } from "../../../../core/ports/lead-magnet.port";
import { createLeadMagnetPortStub } from "../../../../../testing/factories/lead-magnet.factory";
import { ToolkitComponent } from "./toolkit.component";

describe("ToolkitComponent", () => {
  let component: ToolkitComponent;
  let fixture: ComponentFixture<ToolkitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolkitComponent],
      providers: [
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
        // P1.9 : la page utilise RouterLink vers /fr/privacy — fournir un
        // routeur vide pour satisfaire l'injection ActivatedRoute.
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolkitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait rendre le titre principal", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toContain("boite a outils IA");
  });

  it("devrait rendre le composant toolkit-form", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector("app-toolkit-form");
    expect(form).not.toBeNull();
  });

  it("devrait afficher le nom de la marque", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Asili Design");
  });
});
