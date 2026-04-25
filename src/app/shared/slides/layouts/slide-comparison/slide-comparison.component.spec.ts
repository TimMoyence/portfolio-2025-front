import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideComparisonComponent } from "./slide-comparison.component";

@Component({
  standalone: true,
  imports: [SlideComparisonComponent],
  template: `
    <app-slide-comparison
      title="Avant / Après IA"
      leftLabel="Avant"
      rightLabel="Après"
      [leftItems]="['10h facturation', '4h emails', '6h support']"
      [rightItems]="['1h facturation auto', '1h emails IA', '2h support bot']"
    />
  `,
})
class HostComponent {}

describe("SlideComparisonComponent", () => {
  it("rend les deux colonnes avec leurs items", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-comparison");
    expect(root.querySelector("h2").textContent).toContain("Avant / Après IA");
    const cols = root.querySelectorAll(".slide-comparison__column");
    expect(cols.length).toBe(2);
    expect(cols[0].textContent).toContain("Avant");
    expect(cols[0].textContent).toContain("10h facturation");
    expect(cols[1].textContent).toContain("Après");
    expect(cols[1].textContent).toContain("1h facturation auto");
  });
});
