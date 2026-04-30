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

@Component({
  standalone: true,
  imports: [SlideImageLeftComponent],
  template: `
    <app-slide-image-left
      image="/images/x.webp"
      imageAlt="alt"
      title="Titre"
      [paragraphs]="paragraphs"
      [items]="items"
    >
      <span class="extra">extra</span>
    </app-slide-image-left>
  `,
})
class HostFullComponent {
  readonly paragraphs = ["Premier paragraphe", "Second paragraphe"];
  readonly items = ["Item un", "Item deux", "Item trois"];
}

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

  it("rend chaque paragraph en <p> separe", () => {
    const fixture = TestBed.createComponent(HostFullComponent);
    fixture.detectChanges();
    const paragraphs = fixture.nativeElement.querySelectorAll(
      "p.slide-image-left__paragraph",
    );
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].textContent).toContain("Premier paragraphe");
    expect(paragraphs[1].textContent).toContain("Second paragraphe");
  });

  it("rend chaque item en <li>", () => {
    const fixture = TestBed.createComponent(HostFullComponent);
    fixture.detectChanges();
    const ul = fixture.nativeElement.querySelector(
      "ul.slide-image-left__items",
    );
    expect(ul).toBeTruthy();
    const items = ul.querySelectorAll("li");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain("Item un");
    expect(items[2].textContent).toContain("Item trois");
  });

  it("rend titre + paragraphs + items + ng-content combines", () => {
    const fixture = TestBed.createComponent(HostFullComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-image-left");
    expect(root.querySelector("h2")).toBeTruthy();
    expect(root.querySelectorAll("p.slide-image-left__paragraph").length).toBe(
      2,
    );
    expect(root.querySelectorAll(".slide-image-left__items li").length).toBe(3);
    expect(root.querySelector(".extra")).toBeTruthy();
  });
});
