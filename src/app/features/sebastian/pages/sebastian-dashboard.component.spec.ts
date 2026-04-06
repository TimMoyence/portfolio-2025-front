import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import {
  buildSebastianBacResult,
  buildSebastianHealthScore,
  buildSebastianTrendData,
  createSebastianPortStub,
} from "../../../../testing/factories/sebastian.factory";
import { SEBASTIAN_PORT } from "../../../core/ports/sebastian.port";
import { SebastianDashboardComponent } from "./sebastian-dashboard.component";

describe("SebastianDashboardComponent", () => {
  let component: SebastianDashboardComponent;
  let fixture: ComponentFixture<SebastianDashboardComponent>;
  let portStub: ReturnType<typeof createSebastianPortStub>;

  beforeEach(async () => {
    portStub = createSebastianPortStub();
    portStub.getHealthScore.and.returnValue(of(buildSebastianHealthScore()));
    portStub.getBac.and.returnValue(of(buildSebastianBacResult()));
    portStub.getTrends.and.callFake((period: string) =>
      of(buildSebastianTrendData({ period: period as "7d" | "30d" })),
    );

    await TestBed.configureTestingModule({
      imports: [SebastianDashboardComponent],
      providers: [
        { provide: SEBASTIAN_PORT, useValue: portStub },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait charger le health score au demarrage", () => {
    expect(portStub.getHealthScore).toHaveBeenCalled();
    expect(component.healthScore()).toBeTruthy();
    expect(component.healthScore()!.score).toBe(72);
  });

  it("devrait charger les tendances 7d au demarrage", () => {
    expect(portStub.getTrends).toHaveBeenCalledWith("7d");
    expect(component.trends7d()).toBeTruthy();
    expect(component.trends7d()!.period).toBe("7d");
  });

  it("devrait charger les tendances 30d au demarrage", () => {
    expect(portStub.getTrends).toHaveBeenCalledWith("30d");
    expect(component.trends30d()).toBeTruthy();
    expect(component.trends30d()!.period).toBe("30d");
  });

  it("devrait afficher le composant ScoreCard", () => {
    const scoreCard = fixture.nativeElement.querySelector(
      "app-sebastian-score-card",
    );
    expect(scoreCard).toBeTruthy();
  });

  it("devrait afficher deux composants TrendChart", () => {
    const charts = fixture.nativeElement.querySelectorAll(
      "app-sebastian-trend-chart",
    );
    expect(charts.length).toBe(2);
  });

  it("devrait afficher le titre 7 derniers jours", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("7 derniers jours");
  });

  it("devrait afficher le titre 30 derniers jours", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("30 derniers jours");
  });

  it("devrait afficher le resume mensuel sous le graphe 30d", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Moy. alcool");
    expect(content).toContain("Moy. cafe");
    expect(content).toContain("0.5");
    expect(content).toContain("2.5");
  });
});
