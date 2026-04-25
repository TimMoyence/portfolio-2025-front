import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideQuoteComponent } from "./slide-quote.component";

@Component({
  standalone: true,
  imports: [SlideQuoteComponent],
  template: `
    <app-slide-quote
      quote="L'IA n'efface pas le solopreneur, elle le démultiplie."
      author="Maxime Rivet"
      role="Founder"
    />
  `,
})
class HostComponent {}

describe("SlideQuoteComponent", () => {
  it("rend la citation, l'auteur et le rôle", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(".slide-quote");
    expect(root.querySelector("blockquote").textContent).toContain(
      "L'IA n'efface pas",
    );
    expect(root.querySelector(".slide-quote__author").textContent).toContain(
      "Maxime Rivet",
    );
    expect(root.querySelector(".slide-quote__role").textContent).toContain(
      "Founder",
    );
  });
});
