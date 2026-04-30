import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideTableComponent, type TableColumn } from "./slide-table.component";

@Component({
  standalone: true,
  imports: [SlideTableComponent],
  template: `
    <app-slide-table title="Outils IA" [columns]="columns" [rows]="rows" />
  `,
})
class HostComponent {
  readonly columns: TableColumn[] = [
    { key: "tool", label: "Outil" },
    { key: "category", label: "Categorie" },
    { key: "price", label: "Prix" },
  ];
  readonly rows = [
    { tool: "ChatGPT", category: "Produire", price: "Gratuit" },
    { tool: "Claude", category: "Produire", price: "20$/mois" },
    { tool: "Zapier", category: "Automatiser", price: "Gratuit" },
  ];
}

describe("SlideTableComponent", () => {
  it("rend une ligne par row + une cellule par colonne", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
    const headers = root.querySelectorAll("thead th");
    expect(headers.length).toBe(3);
    const firstRowCells = rows[0].querySelectorAll("td");
    expect(firstRowCells.length).toBe(3);
    expect(firstRowCells[0].textContent).toContain("ChatGPT");
  });

  it("affiche les labels i18n des colonnes dans <th>", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const headers = fixture.nativeElement.querySelectorAll("thead th");
    expect(headers[0].textContent).toContain("Outil");
    expect(headers[1].textContent).toContain("Categorie");
    expect(headers[2].textContent).toContain("Prix");
  });

  it("rend le titre quand fourni", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector("h2");
    expect(heading?.textContent).toContain("Outils IA");
  });

  it("retourne chaine vide pour cle absente", () => {
    const fixture = TestBed.createComponent(SlideTableComponent);
    const columns: TableColumn[] = [
      { key: "tool", label: "Outil" },
      { key: "missing", label: "Manquante" },
    ];
    fixture.componentRef.setInput("columns", columns);
    fixture.componentRef.setInput("rows", [{ tool: "ChatGPT" }]);
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll("tbody td");
    expect(cells[0].textContent).toContain("ChatGPT");
    expect((cells[1].textContent ?? "").trim()).toBe("");
  });
});
