import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideHeroComponent } from "./slide-hero.component";

@Component({
  standalone: true,
  imports: [SlideHeroComponent],
  template: `
    <app-slide-hero
      title="IA pour Solopreneurs"
      subtitle="Panorama 2026"
      bgImage="/images/hero.webp"
      bgImageAlt="Espace de travail moderne"
    />
  `,
})
class HostComponent {}

describe("SlideHeroComponent", () => {
  it("rend le titre principal", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector("h1");
    expect(h1.textContent).toContain("IA pour Solopreneurs");
  });

  it("rend le sous-titre", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const subtitle = fixture.nativeElement.querySelector(
      ".slide-hero__subtitle",
    );
    expect(subtitle.textContent).toContain("Panorama 2026");
  });

  it("applique l'image en background", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector(".slide-hero__bg img");
    expect(img.getAttribute("src")).toBe("/images/hero.webp");
    expect(img.getAttribute("alt")).toBe("Espace de travail moderne");
  });
});
