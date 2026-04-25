import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideImageRightComponent } from "./slide-image-right.component";

@Component({
  standalone: true,
  imports: [SlideImageRightComponent],
  template: `
    <app-slide-image-right
      image="/images/tools.webp"
      imageAlt="Outils IA"
      title="Quels outils ?"
    >
      <p>Liste des outils.</p>
    </app-slide-image-right>
  `,
})
class HostComponent {}

describe("SlideImageRightComponent", () => {
  it("rend contenu gauche + image droite", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const children =
      fixture.nativeElement.querySelector(".slide-image-right").children;
    expect(children[0].classList).toContain("slide-image-right__content");
    expect(children[1].classList).toContain("slide-image-right__media");
  });

  it("affiche titre et image avec attributs corrects", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-image-right");
    expect(root.querySelector("h2").textContent).toContain("Quels outils ?");
    const img = root.querySelector("img");
    expect(img.getAttribute("src")).toBe("/images/tools.webp");
    expect(img.getAttribute("alt")).toBe("Outils IA");
  });
});
