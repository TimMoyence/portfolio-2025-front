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

@Component({
  standalone: true,
  imports: [SlideHeroComponent],
  template: `
    <app-slide-hero
      title="Promesse"
      [bullets]="bullets"
      bgImage="/images/promesse.webp"
      bgImageAlt="Scene de presentation"
    />
  `,
})
class HostBulletsComponent {
  readonly bullets = ["Tour d'horizon", "Ce qui marche", "Un exercice"];
}

@Component({
  standalone: true,
  imports: [SlideHeroComponent],
  template: `
    <app-slide-hero
      title="Promesse"
      subtitle="Sous-titre"
      [bullets]="bullets"
      bgImage="/images/promesse.webp"
      bgImageAlt="Scene"
    />
  `,
})
class HostBothComponent {
  readonly bullets = ["Un", "Deux"];
}

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

  it("ne rend pas de liste quand bullets est vide", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const ol = fixture.nativeElement.querySelector(".slide-hero__bullets");
    expect(ol).toBeNull();
  });

  it("rend une liste ordonnee quand bullets fournis", () => {
    const fixture = TestBed.createComponent(HostBulletsComponent);
    fixture.detectChanges();
    const ol = fixture.nativeElement.querySelector("ol.slide-hero__bullets");
    expect(ol).toBeTruthy();
    const items = ol.querySelectorAll("li");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain("Tour d'horizon");
    expect(items[1].textContent).toContain("Ce qui marche");
    expect(items[2].textContent).toContain("Un exercice");
  });

  it("rend subtitle puis bullets quand les deux sont fournis", () => {
    const fixture = TestBed.createComponent(HostBothComponent);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector(".slide-hero__content");
    const subtitle = content.querySelector(".slide-hero__subtitle");
    const ol = content.querySelector(".slide-hero__bullets");
    expect(subtitle).toBeTruthy();
    expect(ol).toBeTruthy();
    // ordre DOM : subtitle avant bullets
    expect(
      subtitle.compareDocumentPosition(ol) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
