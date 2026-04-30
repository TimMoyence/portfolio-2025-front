import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideStatsComponent } from "./slide-stats.component";

@Component({
  standalone: true,
  imports: [SlideStatsComponent],
  template: `
    <app-slide-stats
      title="Le marché en 2026"
      [stats]="[
        {
          value: '1,3 Md',
          label: 'utilisateurs IA mondial',
          source: 'McKinsey',
        },
        { value: '67%', label: 'PME utilisent un outil IA' },
        { value: '12 h/sem', label: 'gain moyen annoncé' },
      ]"
    />
  `,
})
class HostComponent {}

describe("SlideStatsComponent", () => {
  it("rend le titre et chaque stat", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-stats");
    expect(root.querySelector("h2").textContent).toContain("Le marché en 2026");
    const items = root.querySelectorAll(".slide-stats__item");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain("1,3 Md");
    expect(items[1].textContent).toContain("67%");
  });

  it("affiche la source quand fournie", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const sources = fixture.nativeElement.querySelectorAll(
      ".slide-stats__source",
    );
    expect(sources.length).toBe(1);
    expect(sources[0].textContent).toContain("McKinsey");
  });
});
