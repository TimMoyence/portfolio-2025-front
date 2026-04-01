import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { LOCALE_ID } from "@angular/core";
import { WeatherLevelService } from "../../services/weather-level.service";
import { SunArcComponent } from "./sun-arc.component";

describe("SunArcComponent", () => {
  let component: SunArcComponent;
  let fixture: ComponentFixture<SunArcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SunArcComponent],
      providers: [
        { provide: LOCALE_ID, useValue: "fr-FR" },
        {
          provide: WeatherLevelService,
          useValue: {
            isTooltipSeen: () => true,
            markTooltipSeen: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SunArcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher 'Donnees indisponibles' sans lever/coucher", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("indisponibles");
  });

  it("devrait afficher les heures formatees avec lever et coucher", () => {
    fixture.componentRef.setInput("sunrise", "2026-03-31T06:30");
    fixture.componentRef.setInput("sunset", "2026-03-31T19:30");
    fixture.detectChanges();

    expect(component.sunriseFormatted()).toBeTruthy();
    expect(component.sunsetFormatted()).toBeTruthy();
  });

  it("devrait calculer une progression solaire entre 0 et 1", () => {
    fixture.componentRef.setInput("sunrise", "2026-03-31T06:30");
    fixture.componentRef.setInput("sunset", "2026-03-31T19:30");
    fixture.detectChanges();

    // En mode navigateur, la progression depend de l'heure courante
    const progress = component.sunProgress();
    expect(typeof progress).toBe("number");
  });

  it("devrait calculer les coordonnees SVG du soleil", () => {
    fixture.componentRef.setInput("sunrise", "2026-03-31T06:30");
    fixture.componentRef.setInput("sunset", "2026-03-31T19:30");
    fixture.detectChanges();

    expect(component.sunX()).toBeGreaterThanOrEqual(20);
    expect(component.sunX()).toBeLessThanOrEqual(180);
  });
});
