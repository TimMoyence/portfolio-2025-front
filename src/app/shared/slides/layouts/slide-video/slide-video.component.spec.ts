import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlideVideoComponent } from './slide-video.component';

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

@Component({
  standalone: true,
  imports: [SlideVideoComponent],
  template: `
    <app-slide-video
      src="https://www.youtube-nocookie.com/embed/xyz789"
      type="iframe"
      caption="YouTube no-cookie"
    />
  `,
})
class HostNocookieComponent {}

@Component({
  standalone: true,
  imports: [SlideVideoComponent],
  template: `
    <app-slide-video src="https://evil.example/x" type="iframe" caption="Hôte non autorisé" />
  `,
})
class HostEvilComponent {}

describe('SlideVideoComponent', () => {
  it('rend une balise <video> en mode natif', () => {
    const fixture = TestBed.createComponent(HostNativeComponent);
    fixture.detectChanges();
    const video = fixture.nativeElement.querySelector('video');
    expect(video).toBeTruthy();
    expect(video.getAttribute('poster')).toBe('/images/demo-poster.webp');
  });

  it('rend une iframe quand type=iframe', () => {
    const fixture = TestBed.createComponent(HostIframeComponent);
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('youtube.com');
  });

  it('rend la source pour un hôte autorisé (youtube-nocookie)', () => {
    const fixture = TestBed.createComponent(HostNocookieComponent);
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('youtube-nocookie.com');
  });

  it('neutralise la source pour un hôte non autorisé (defense en profondeur)', () => {
    const fixture = TestBed.createComponent(HostEvilComponent);
    fixture.detectChanges();
    const iframe = fixture.nativeElement.querySelector('iframe');
    expect(iframe).toBeTruthy();
    const src = iframe.getAttribute('src') ?? '';
    expect(src).not.toContain('evil.example');
    expect(src).toBe('');
  });

  it('affiche la caption sous la vidéo', () => {
    const fixture = TestBed.createComponent(HostNativeComponent);
    fixture.detectChanges();
    const caption = fixture.nativeElement.querySelector('.slide-video__caption');
    expect(caption.textContent).toContain('Démonstration outil IA');
  });
});
