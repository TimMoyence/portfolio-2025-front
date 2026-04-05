import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  buildSebastianEntry,
  createSebastianPortStub,
} from "../../../../testing/factories/sebastian.factory";
import { SEBASTIAN_PORT } from "../../../core/ports/sebastian.port";
import { SebastianHistoryComponent } from "./sebastian-history.component";

describe("SebastianHistoryComponent", () => {
  let component: SebastianHistoryComponent;
  let fixture: ComponentFixture<SebastianHistoryComponent>;
  let portStub: ReturnType<typeof createSebastianPortStub>;

  beforeEach(async () => {
    portStub = createSebastianPortStub();
    portStub.getEntries.and.returnValue(
      of([
        buildSebastianEntry({ id: "e1", category: "coffee", quantity: 2 }),
        buildSebastianEntry({
          id: "e2",
          category: "alcohol",
          quantity: 1,
          unit: "standard_drink",
          date: "2026-04-03",
          notes: "Biere avec amis",
        }),
        buildSebastianEntry({ id: "e3", category: "coffee", quantity: 1 }),
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [SebastianHistoryComponent],
      providers: [{ provide: SEBASTIAN_PORT, useValue: portStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });

  it("devrait charger les entrees au demarrage", () => {
    expect(portStub.getEntries).toHaveBeenCalled();
    expect(component.entries().length).toBe(3);
  });

  it("devrait afficher toutes les entrees", () => {
    const items = fixture.nativeElement.querySelectorAll(
      "[data-testid='entry-item']",
    );
    expect(items.length).toBe(3);
  });

  it("devrait afficher l'icone de categorie appropriee", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("\u2615"); // ☕
    expect(content).toContain("\uD83C\uDF7A"); // 🍺
  });

  it("devrait afficher les notes quand presentes", () => {
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain("Biere avec amis");
  });

  it("devrait afficher les controles de filtre", () => {
    const categoryFilter = fixture.nativeElement.querySelector(
      "[data-testid='category-filter']",
    );
    expect(categoryFilter).toBeTruthy();
  });

  it("devrait filtrer par categorie", () => {
    portStub.getEntries.calls.reset();
    portStub.getEntries.and.returnValue(
      of([buildSebastianEntry({ id: "e1", category: "coffee", quantity: 2 })]),
    );

    component.onCategoryChange("coffee");
    fixture.detectChanges();

    expect(portStub.getEntries).toHaveBeenCalledWith(
      jasmine.objectContaining({ category: "coffee" }),
    );
  });

  it("devrait supprimer une entree quand on clique sur supprimer", () => {
    portStub.deleteEntry.and.returnValue(of(void 0));

    const deleteButtons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll("[data-testid='delete-entry']");
    expect(deleteButtons.length).toBeGreaterThan(0);

    deleteButtons[0].click();
    fixture.detectChanges();

    expect(portStub.deleteEntry).toHaveBeenCalledWith("e1");
  });

  it("devrait mettre a jour la liste apres suppression", () => {
    portStub.deleteEntry.and.returnValue(of(void 0));
    // Re-configure getEntries pour le rechargement
    portStub.getEntries.and.returnValue(
      of([
        buildSebastianEntry({
          id: "e2",
          category: "alcohol",
          unit: "standard_drink",
        }),
        buildSebastianEntry({ id: "e3", category: "coffee" }),
      ]),
    );

    component.removeEntry("e1");
    fixture.detectChanges();

    expect(component.entries().length).toBe(2);
    expect(component.entries().find((e) => e.id === "e1")).toBeUndefined();
  });

  it("devrait afficher un message vide quand il n y a pas d entrees", () => {
    portStub.getEntries.and.returnValue(of([]));
    component.loadEntries();
    fixture.detectChanges();

    const emptyMessage = fixture.nativeElement.querySelector(
      "[data-testid='empty-state']",
    );
    expect(emptyMessage).toBeTruthy();
  });

  it("devrait afficher le filtre de dates", () => {
    const dateFrom = fixture.nativeElement.querySelector(
      "[data-testid='date-from']",
    );
    const dateTo = fixture.nativeElement.querySelector(
      "[data-testid='date-to']",
    );
    expect(dateFrom).toBeTruthy();
    expect(dateTo).toBeTruthy();
  });

  it("devrait utiliser les tokens de design SSOT", () => {
    const surface =
      fixture.nativeElement.querySelectorAll(".bg-scheme-surface");
    expect(surface.length).toBeGreaterThan(0);
  });
});
