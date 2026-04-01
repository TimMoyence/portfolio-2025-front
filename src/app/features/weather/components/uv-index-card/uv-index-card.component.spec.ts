import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { WeatherLevelService } from "../../services/weather-level.service";
import { UvIndexCardComponent } from "./uv-index-card.component";

describe("UvIndexCardComponent", () => {
  let component: UvIndexCardComponent;
  let fixture: ComponentFixture<UvIndexCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UvIndexCardComponent],
      providers: [
        {
          provide: WeatherLevelService,
          useValue: {
            isTooltipSeen: () => true,
            markTooltipSeen: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UvIndexCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher 'Faible' pour un UV de 2", () => {
    fixture.componentRef.setInput("uvIndex", 2);
    fixture.detectChanges();
    expect(component.riskLabel()).toContain("Faible");
  });

  it("devrait afficher 'Modéré' pour un UV de 4", () => {
    fixture.componentRef.setInput("uvIndex", 4);
    fixture.detectChanges();
    expect(component.riskLabel()).toContain("Mod");
  });

  it("devrait afficher 'Élevé' pour un UV de 7", () => {
    fixture.componentRef.setInput("uvIndex", 7);
    fixture.detectChanges();
    expect(component.riskLabel()).toContain("lev");
  });

  it("devrait afficher 'Très élevé' pour un UV de 9", () => {
    fixture.componentRef.setInput("uvIndex", 9);
    fixture.detectChanges();
    expect(component.riskLabel()).toContain("lev");
  });

  it("devrait afficher 'Extrême' pour un UV de 12", () => {
    fixture.componentRef.setInput("uvIndex", 12);
    fixture.detectChanges();
    expect(component.riskLabel()).toContain("Extr");
  });

  it("devrait limiter la position de jauge a 100%", () => {
    fixture.componentRef.setInput("uvIndex", 15);
    fixture.detectChanges();
    expect(component.gaugePosition()).toBe(100);
  });
});
