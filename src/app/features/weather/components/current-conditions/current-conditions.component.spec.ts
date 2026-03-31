import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { CurrentConditionsComponent } from "./current-conditions.component";

describe("CurrentConditionsComponent", () => {
  let component: CurrentConditionsComponent;
  let fixture: ComponentFixture<CurrentConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentConditionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait retourner une chaine vide si aucune donnee courante", () => {
    expect(component.icon()).toBe("");
    expect(component.description()).toBe("");
  });

  it("devrait calculer l'icone et la description quand les donnees sont presentes", () => {
    fixture.componentRef.setInput("current", {
      time: "2026-03-31T12:00",
      temperature_2m: 18,
      weather_code: 0,
      wind_speed_10m: 12,
      apparent_temperature: 16,
    });
    fixture.detectChanges();

    expect(component.icon()).toContain("soleil.png");
    expect(component.description()).toBe("Ciel dégagé");
  });

  it("devrait afficher l'icone nuage pour un code couvert", () => {
    fixture.componentRef.setInput("current", {
      time: "2026-03-31T12:00",
      temperature_2m: 10,
      weather_code: 3,
      wind_speed_10m: 20,
      apparent_temperature: 8,
    });
    fixture.detectChanges();

    expect(component.icon()).toContain("nuage.png");
    expect(component.description()).toBe("Couvert");
  });
});
