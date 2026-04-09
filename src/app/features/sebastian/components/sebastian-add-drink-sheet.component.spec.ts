import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { Component, signal } from "@angular/core";
import type { SebastianEntry } from "../../../core/models/sebastian.model";
import { buildSebastianEntry } from "../../../../testing/factories/sebastian.factory";
import { SebastianAddDrinkSheetComponent } from "./sebastian-add-drink-sheet.component";

/**
 * Hote de test pour fournir les inputs via des signaux.
 */
@Component({
  standalone: true,
  imports: [SebastianAddDrinkSheetComponent],
  template: `<app-sebastian-add-drink-sheet
    [open]="open()"
    [recentEntries]="recentEntries()"
    (openChange)="openChange($event)"
    (addDrink)="addDrink($event)"
  />`,
})
class TestHostComponent {
  readonly open = signal(true);
  readonly recentEntries = signal<SebastianEntry[]>([]);
  openChange = jasmine.createSpy("openChange");
  addDrink = jasmine.createSpy("addDrink");
}

describe("SebastianAddDrinkSheetComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let component: SebastianAddDrinkSheetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait initialiser avec les valeurs par defaut biere (degree 5, volumeCl 25, quantity 1)", () => {
    expect(component.selectedDrinkType()).toBe("beer");
    expect(component.degree()).toBe(5);
    expect(component.volumeCl()).toBe(25);
    expect(component.quantity()).toBe(1);
  });

  it("devrait changer les defaults quand on selectionne wine (degree 12, volumeCl 12.5)", () => {
    component.selectDrinkType("wine");
    expect(component.selectedDrinkType()).toBe("wine");
    expect(component.degree()).toBe(12);
    expect(component.volumeCl()).toBe(12.5);
  });

  it("devrait changer les defaults pour cocktail (degree 15, volumeCl 20)", () => {
    component.selectDrinkType("cocktail");
    expect(component.selectedDrinkType()).toBe("cocktail");
    expect(component.degree()).toBe(15);
    expect(component.volumeCl()).toBe(20);
  });

  it("devrait emettre un payload correct a la soumission", () => {
    component.selectDrinkType("beer");
    component.quantity.set(2);
    component.submit();

    expect(host.addDrink).toHaveBeenCalledWith(
      jasmine.objectContaining({
        category: "alcohol",
        quantity: 2,
        drinkType: "beer",
        alcoholDegree: 5,
        volumeCl: 25,
      }),
    );
    expect(host.openChange).toHaveBeenCalledWith(false);
  });

  it("devrait inclure consumedAt quand timeMode est custom", () => {
    component.timeMode.set("custom");
    component.customDate.set("2026-04-09");
    component.customTime.set("14:30");
    component.submit();

    const payload = host.addDrink.calls.mostRecent().args[0];
    expect(payload.consumedAt).toBeDefined();
    expect(payload.consumedAt).toContain("2026-04-09");
  });

  it('devrait inclure consumedAt pour "il y a 30m"', () => {
    component.timeMode.set("30m");
    const before = Date.now();
    component.submit();
    const after = Date.now();

    const payload = host.addDrink.calls.mostRecent().args[0];
    expect(payload.consumedAt).toBeDefined();

    const consumedAtMs = new Date(payload.consumedAt).getTime();
    // consumedAt devrait etre ~30 minutes avant maintenant (tolerance 2s)
    const thirtyMinMs = 30 * 60 * 1000;
    expect(consumedAtMs).toBeGreaterThanOrEqual(before - thirtyMinMs - 2000);
    expect(consumedAtMs).toBeLessThanOrEqual(after - thirtyMinMs + 2000);
  });

  it("devrait incrementer la quantite", () => {
    expect(component.quantity()).toBe(1);
    component.incrementQuantity();
    expect(component.quantity()).toBe(2);
    component.incrementQuantity();
    expect(component.quantity()).toBe(3);
  });

  it("devrait decrementer la quantite (min 1)", () => {
    component.quantity.set(3);
    component.decrementQuantity();
    expect(component.quantity()).toBe(2);
    component.decrementQuantity();
    expect(component.quantity()).toBe(1);
    component.decrementQuantity();
    expect(component.quantity()).toBe(1);
  });

  it("devrait afficher les recents passes en input", () => {
    const recents = [
      buildSebastianEntry({
        id: "r1",
        category: "alcohol",
        drinkType: "wine",
        alcoholDegree: 12,
        volumeCl: 12.5,
      }),
      buildSebastianEntry({
        id: "r2",
        category: "coffee",
        drinkType: "coffee",
      }),
    ];
    host.recentEntries.set(recents);
    fixture.detectChanges();

    const recentChips = fixture.nativeElement.querySelectorAll(
      "[data-testid='recent-chip']",
    );
    expect(recentChips.length).toBe(2);
  });

  it("devrait ne pas avoir de consumedAt quand timeMode est now", () => {
    component.timeMode.set("now");
    component.submit();

    const payload = host.addDrink.calls.mostRecent().args[0];
    expect(payload.consumedAt).toBeUndefined();
  });
});
