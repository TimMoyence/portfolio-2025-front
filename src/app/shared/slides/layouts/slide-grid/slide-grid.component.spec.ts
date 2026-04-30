import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideGridComponent } from "./slide-grid.component";

@Component({
  standalone: true,
  imports: [SlideGridComponent],
  template: `
    <app-slide-grid
      title="Top 6 outils"
      [items]="[
        { title: 'ChatGPT', description: 'Conversation' },
        { title: 'Claude', description: 'Analyse' },
        { title: 'Midjourney', description: 'Visuels' },
      ]"
    />
  `,
})
class HostComponent {}

describe("SlideGridComponent", () => {
  it("rend une carte par item", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll(".slide-grid__card");
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain("ChatGPT");
    expect(cards[1].textContent).toContain("Analyse");
  });
});
