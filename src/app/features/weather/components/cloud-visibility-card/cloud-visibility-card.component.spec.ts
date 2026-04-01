import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { WeatherLevelService } from "../../services/weather-level.service";
import { CloudVisibilityCardComponent } from "./cloud-visibility-card.component";

describe("CloudVisibilityCardComponent", () => {
  let component: CloudVisibilityCardComponent;
  let fixture: ComponentFixture<CloudVisibilityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudVisibilityCardComponent],
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

    fixture = TestBed.createComponent(CloudVisibilityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait afficher 'Degage' pour une couverture <= 10%", () => {
    fixture.componentRef.setInput("cloudCover", 5);
    fixture.detectChanges();
    expect(component.cloudLabel()).toContain("gag");
  });

  it("devrait afficher 'Couvert' pour une couverture > 90%", () => {
    fixture.componentRef.setInput("cloudCover", 95);
    fixture.detectChanges();
    expect(component.cloudLabel()).toContain("Couvert");
  });

  it("devrait utiliser l'icone soleil pour une couverture faible", () => {
    fixture.componentRef.setInput("cloudCover", 10);
    fixture.detectChanges();
    expect(component.cloudIcon()).toContain("soleil.png");
  });

  it("devrait utiliser l'icone nuage pour une couverture elevee", () => {
    fixture.componentRef.setInput("cloudCover", 80);
    fixture.detectChanges();
    expect(component.cloudIcon()).toContain("nuage.png");
  });

  it("devrait convertir la visibilite en kilometres", () => {
    fixture.componentRef.setInput("visibility", 15000);
    fixture.detectChanges();
    expect(component.visibilityKm()).toBe(15);
  });

  it("devrait afficher la visibilite si fournie", () => {
    fixture.componentRef.setInput("cloudCover", 50);
    fixture.componentRef.setInput("visibility", 10000);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("Visibilit");
    expect(el.textContent).toContain("km");
  });
});
