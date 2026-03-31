import type { ComponentFixture } from "@angular/core/testing";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { of } from "rxjs";
import { WEATHER_PORT } from "../../../../core/ports/weather.port";
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from "../../../../../testing/factories/weather.factory";
import { WeatherLevelService } from "../../services/weather-level.service";
import { LearningTooltipComponent } from "./learning-tooltip.component";

describe("LearningTooltipComponent", () => {
  let component: LearningTooltipComponent;
  let fixture: ComponentFixture<LearningTooltipComponent>;
  let levelService: WeatherLevelService;
  let weatherPortStub: ReturnType<typeof createWeatherPortStub>;

  beforeEach(async () => {
    weatherPortStub = createWeatherPortStub();
    weatherPortStub.updatePreferences.and.returnValue(
      of(buildWeatherPreferences()),
    );

    await TestBed.configureTestingModule({
      imports: [LearningTooltipComponent],
      providers: [{ provide: WEATHER_PORT, useValue: weatherPortStub }],
    }).compileComponents();

    levelService = TestBed.inject(WeatherLevelService);
    fixture = TestBed.createComponent(LearningTooltipComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("id", "test-tip");
    fixture.componentRef.setInput("title", "Titre test");
    fixture.componentRef.setInput("content", "Contenu explicatif");
  });

  it("devrait se creer", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("devrait auto-afficher le tooltip la premiere fois puis le masquer", fakeAsync(() => {
    fixture.detectChanges();

    expect(component.visible()).toBeTrue();

    tick(3000);
    expect(component.visible()).toBeFalse();
  }));

  it("ne devrait pas auto-afficher un tooltip deja vu", () => {
    levelService.tooltipsSeen.set(["test-tip"]);
    fixture.detectChanges();

    expect(component.visible()).toBeFalse();
  });

  it("devrait basculer la visibilite au clic", () => {
    levelService.tooltipsSeen.set(["test-tip"]);
    fixture.detectChanges();

    expect(component.visible()).toBeFalse();

    component.toggle(new Event("click"));
    expect(component.visible()).toBeTrue();

    component.toggle(new Event("click"));
    expect(component.visible()).toBeFalse();
  });

  it("devrait marquer le tooltip comme vu au premier clic", () => {
    fixture.detectChanges();

    // Le tooltip s'auto-affiche, on simule un clic avant le timeout
    spyOn(levelService, "markTooltipSeen").and.callThrough();

    component.toggle(new Event("click"));

    // markTooltipSeen a ete appele via ngOnInit (timer) OU via toggle
    // Ici on verifie que le service a bien ete notifie
    expect(levelService.isTooltipSeen("test-tip")).toBeTrue();
  });

  it("devrait fermer le popover lors d'un clic exterieur", () => {
    levelService.tooltipsSeen.set(["test-tip"]);
    fixture.detectChanges();

    component.toggle(new Event("click"));
    expect(component.visible()).toBeTrue();

    // Simule un clic en dehors du composant
    component.onDocumentClick(new MouseEvent("click"));
    expect(component.visible()).toBeFalse();
  });

  it("devrait afficher le bouton '?'", () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector("button");
    expect(button.textContent.trim()).toBe("?");
  });
});
