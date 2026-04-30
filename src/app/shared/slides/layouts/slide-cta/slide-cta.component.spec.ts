import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideCtaComponent } from "./slide-cta.component";

@Component({
  standalone: true,
  imports: [SlideCtaComponent],
  template: `
    <app-slide-cta
      title="Récupère le toolkit"
      description="PDF gratuit avec mes prompts IA"
      ctaLabel="Télécharger"
      ctaHref="/formations/ia-solopreneurs/toolkit"
    />
  `,
})
class HostComponent {}

describe("SlideCtaComponent", () => {
  it("rend titre, description et bouton CTA", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-cta");
    expect(root.querySelector("h2").textContent).toContain(
      "Récupère le toolkit",
    );
    expect(root.querySelector("p").textContent).toContain("PDF gratuit");
    const btn = root.querySelector("a.slide-cta__btn");
    expect(btn.textContent).toContain("Télécharger");
    expect(btn.getAttribute("href")).toBe(
      "/formations/ia-solopreneurs/toolkit",
    );
  });
});
