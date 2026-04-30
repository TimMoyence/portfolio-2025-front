import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  type ComparisonColumn,
  SlideComparisonComponent,
} from "./slide-comparison.component";

@Component({
  standalone: true,
  imports: [SlideComparisonComponent],
  template: `
    <app-slide-comparison title="Avant / Après IA" [columns]="columns" />
  `,
})
class HostComponent {
  readonly columns: ComparisonColumn[] = [
    {
      label: "Avant",
      tone: "danger",
      items: ["10h facturation", "4h emails", "6h support"],
    },
    {
      label: "Après",
      tone: "success",
      items: ["1h facturation auto", "1h emails IA", "2h support bot"],
    },
  ];
}

@Component({
  standalone: true,
  imports: [SlideComparisonComponent],
  template: ` <app-slide-comparison title="Trois LLMs" [columns]="columns" /> `,
})
class HostThreeComponent {
  readonly columns: ComparisonColumn[] = [
    { label: "ChatGPT", tone: "info", items: ["a", "b"] },
    { label: "Claude", tone: "success", items: ["c", "d"] },
    { label: "Gemini", tone: "warning", items: ["e", "f"] },
  ];
}

@Component({
  standalone: true,
  imports: [SlideComparisonComponent],
  template: `<app-slide-comparison [columns]="columns" />`,
})
class HostNoToneComponent {
  readonly columns: ComparisonColumn[] = [
    { label: "Col1", items: ["x"] },
    { label: "Col2", items: ["y"] },
  ];
}

describe("SlideComparisonComponent", () => {
  it("rend deux colonnes avec leurs items", () => {
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

  it("rend N colonnes (3) dynamiquement", () => {
    const fixture = TestBed.createComponent(HostThreeComponent);
    fixture.detectChanges();
    const cols = fixture.nativeElement.querySelectorAll(
      ".slide-comparison__column",
    );
    expect(cols.length).toBe(3);
    expect(cols[0].textContent).toContain("ChatGPT");
    expect(cols[1].textContent).toContain("Claude");
    expect(cols[2].textContent).toContain("Gemini");
  });

  it("applique la classe tone selon col.tone", () => {
    const fixture = TestBed.createComponent(HostThreeComponent);
    fixture.detectChanges();
    const cols = fixture.nativeElement.querySelectorAll(
      ".slide-comparison__column",
    );
    expect(cols[0].classList).toContain("tone-info");
    expect(cols[1].classList).toContain("tone-success");
    expect(cols[2].classList).toContain("tone-warning");
  });

  it("retombe sur tone-neutral quand tone non fourni", () => {
    const fixture = TestBed.createComponent(HostNoToneComponent);
    fixture.detectChanges();
    const cols = fixture.nativeElement.querySelectorAll(
      ".slide-comparison__column",
    );
    expect(cols[0].classList).toContain("tone-neutral");
    expect(cols[1].classList).toContain("tone-neutral");
  });

  it("expose le nombre de colonnes via --cols", () => {
    const fixture = TestBed.createComponent(HostThreeComponent);
    fixture.detectChanges();
    const grid: HTMLElement = fixture.nativeElement.querySelector(
      ".slide-comparison__grid",
    );
    expect(grid.style.getPropertyValue("--cols")).toBe("3");
  });

  it("rend les items de chaque colonne", () => {
    const fixture = TestBed.createComponent(HostThreeComponent);
    fixture.detectChanges();
    const cols = fixture.nativeElement.querySelectorAll(
      ".slide-comparison__column",
    );
    expect(cols[0].querySelectorAll("li").length).toBe(2);
    expect(cols[1].querySelectorAll("li")[0].textContent).toContain("c");
    expect(cols[2].querySelectorAll("li")[1].textContent).toContain("f");
  });
});
