import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideTableComponent } from "./slide-table.component";

@Component({
  standalone: true,
  imports: [SlideTableComponent],
  template: `
    <app-slide-table title="Outils IA" [headers]="headers" [rows]="rows" />
  `,
})
class HostComponent {
  readonly headers = ["Outil", "Categorie", "Prix"];
  readonly rows = [
    { Outil: "ChatGPT", Categorie: "Produire", Prix: "Gratuit" },
    { Outil: "Claude", Categorie: "Produire", Prix: "20$/mois" },
    { Outil: "Zapier", Categorie: "Automatiser", Prix: "Gratuit" },
  ];
}

describe("SlideTableComponent", () => {
  it("rend une ligne par row + une cellule par header", () => {
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

  it("rend le titre quand fourni", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector("h2");
    expect(heading?.textContent).toContain("Outils IA");
  });

  it("retourne chaine vide pour cle absente", () => {
    const fixture = TestBed.createComponent(SlideTableComponent);
    fixture.componentRef.setInput("headers", ["Outil", "Manquante"]);
    fixture.componentRef.setInput("rows", [{ Outil: "ChatGPT" }]);
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll("tbody td");
    expect(cells[0].textContent).toContain("ChatGPT");
    expect((cells[1].textContent ?? "").trim()).toBe("");
  });
});
