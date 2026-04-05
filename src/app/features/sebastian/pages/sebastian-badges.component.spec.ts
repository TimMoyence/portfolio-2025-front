import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  buildSebastianBadgeStatus,
  createSebastianPortStub,
} from "../../../../testing/factories/sebastian.factory";
import { SEBASTIAN_PORT } from "../../../core/ports/sebastian.port";
import { SebastianBadgesComponent } from "./sebastian-badges.component";

describe("SebastianBadgesComponent", () => {
  let component: SebastianBadgesComponent;
  let fixture: ComponentFixture<SebastianBadgesComponent>;
  let portStub: ReturnType<typeof createSebastianPortStub>;

  const badges = [
    buildSebastianBadgeStatus({ key: "first-entry", name: "Premiere entree" }),
    buildSebastianBadgeStatus({
      key: "streak-7",
      name: "Semaine parfaite",
      unlocked: false,
      unlockedAt: undefined,
    }),
    buildSebastianBadgeStatus({
      key: "streak-30",
      name: "Mois parfait",
      unlocked: false,
      unlockedAt: undefined,
    }),
  ];

  beforeEach(async () => {
    portStub = createSebastianPortStub();
    portStub.getBadges.and.returnValue(of(badges));

    await TestBed.configureTestingModule({
      imports: [SebastianBadgesComponent],
      providers: [{ provide: SEBASTIAN_PORT, useValue: portStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianBadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait charger les badges au demarrage", () => {
    expect(portStub.getBadges).toHaveBeenCalled();
    expect(component.badges().length).toBe(3);
  });

  it("devrait afficher un BadgeCard par badge", () => {
    const cards = fixture.nativeElement.querySelectorAll(
      "app-sebastian-badge-card",
    );
    expect(cards.length).toBe(3);
  });

  it("devrait afficher les noms des badges", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Premiere entree");
    expect(content).toContain("Semaine parfaite");
    expect(content).toContain("Mois parfait");
  });

  it("devrait utiliser une grille responsive", () => {
    const grid: HTMLElement | null = fixture.nativeElement.querySelector(
      "[data-testid='badges-grid']",
    );
    expect(grid).toBeTruthy();
    expect(grid!.classList).toContain("grid");
    expect(grid!.classList).toContain("grid-cols-2");
  });
});
