import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideVideoComponent } from "./slide-video.component";

@Component({
  standalone: true,
  imports: [SlideVideoComponent],
  template: `
    <app-slide-video
      src="/videos/demo.mp4"
      poster="/images/demo-poster.webp"
      caption="Démonstration outil IA"
    />
  `,
})
class HostNativeComponent {}

@Component({
  standalone: true,
  imports: [SlideVideoComponent],
  template: `
    <app-slide-video
      src="https://www.youtube.com/embed/abc123"
      type="iframe"
      caption="Tutoriel YouTube"
    />
  `,
})
class HostIframeComponent {}

describe("SlideVideoComponent", () => {
  it("rend une balise <video> en mode natif", () => {
    const fixture = TestBed.createComponent(HostNativeComponent);
    fixture.detectChanges();
    const video = fixture.nativeElement.querySelector("video");
    expect(video).toBeTruthy();
    expect(video.getAttribute("poster")).toBe("/images/demo-poster.webp");
  });

  it("rend une iframe quand type=iframe", () => {
    const fixture = TestBed.createComponent(HostIframeComponent);
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector("iframe");
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute("src")).toContain("youtube.com");
  });

  it("affiche la caption sous la vidéo", () => {
    const fixture = TestBed.createComponent(HostNativeComponent);
    fixture.detectChanges();
    const caption = fixture.nativeElement.querySelector(
      ".slide-video__caption",
    );
    expect(caption.textContent).toContain("Démonstration outil IA");
  });
});
