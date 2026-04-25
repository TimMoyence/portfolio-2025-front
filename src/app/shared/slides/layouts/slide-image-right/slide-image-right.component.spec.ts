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

@Component({
  standalone: true,
  imports: [SlideImageRightComponent],
  template: `
    <app-slide-image-right
      image="/images/x.webp"
      imageAlt="alt"
      title="Titre"
      [paragraphs]="paragraphs"
      [items]="items"
    >
      <span class="extra">extra</span>
    </app-slide-image-right>
  `,
})
class HostFullComponent {
  readonly paragraphs = ["Premier paragraphe", "Second paragraphe"];
  readonly items = ["Item un", "Item deux", "Item trois"];
}

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

  it("rend chaque paragraph en <p> separe", () => {
    const fixture = TestBed.createComponent(HostFullComponent);
    fixture.detectChanges();
    const paragraphs = fixture.nativeElement.querySelectorAll(
      "p.slide-image-right__paragraph",
    );
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].textContent).toContain("Premier paragraphe");
    expect(paragraphs[1].textContent).toContain("Second paragraphe");
  });

  it("rend chaque item en <li>", () => {
    const fixture = TestBed.createComponent(HostFullComponent);
    fixture.detectChanges();
    const ul = fixture.nativeElement.querySelector(
      "ul.slide-image-right__items",
    );
    expect(ul).toBeTruthy();
    const items = ul.querySelectorAll("li");
    expect(items.length).toBe(3);
    expect(items[2].textContent).toContain("Item trois");
  });

  it("rend titre + paragraphs + items + ng-content combines", () => {
    const fixture = TestBed.createComponent(HostFullComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-image-right");
    expect(root.querySelector("h2")).toBeTruthy();
    expect(root.querySelectorAll("p.slide-image-right__paragraph").length).toBe(
      2,
    );
    expect(root.querySelectorAll(".slide-image-right__items li").length).toBe(
      3,
    );
    expect(root.querySelector(".extra")).toBeTruthy();
  });
});
