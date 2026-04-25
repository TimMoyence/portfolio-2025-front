import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideImageLeftComponent } from "./slide-image-left.component";

@Component({
  standalone: true,
  imports: [SlideImageLeftComponent],
  template: `
    <app-slide-image-left
      image="/images/why.webp"
      imageAlt="Diagramme pourquoi"
      title="Pourquoi maintenant ?"
    >
      <p>Contenu projeté.</p>
    </app-slide-image-left>
  `,
})
class HostComponent {}

describe("SlideImageLeftComponent", () => {
  it("rend image gauche + titre + projection ng-content", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-image-left");
    expect(root).toBeTruthy();
    const img = root.querySelector("img");
    expect(img.getAttribute("src")).toBe("/images/why.webp");
    expect(img.getAttribute("alt")).toBe("Diagramme pourquoi");
    const h2 = root.querySelector("h2");
    expect(h2.textContent).toContain("Pourquoi maintenant ?");
    const projected = root.querySelector("p");
    expect(projected.textContent).toContain("Contenu projeté.");
  });

  it("respecte l'ordre: image avant contenu", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const children =
      fixture.nativeElement.querySelector(".slide-image-left").children;
    expect(children[0].classList).toContain("slide-image-left__media");
    expect(children[1].classList).toContain("slide-image-left__content");
  });
});
