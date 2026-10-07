import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImagePrioritaireDirective } from './image-prioritaire.directive';

@Component({
  standalone: true,
  imports: [ImagePrioritaireDirective],
  template: `<img
    src="/assets/cours/b2-02/v2/cinq-factures.webp"
    alt=""
    [appImagePrioritaire]="prioritaire()"
  />`,
})
class HoteComponent {
  readonly prioritaire = signal(false);
}

describe('ImagePrioritaireDirective', () => {
  const imageDe = (prioritaire: boolean): HTMLImageElement => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.componentInstance.prioritaire.set(prioritaire);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('img') as HTMLImageElement;
  };

  it('diffère le chargement et décode sans bloquer une image ordinaire', () => {
    const image = imageDe(false);

    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.hasAttribute('fetchpriority')).toBeFalse();
    expect(image.getAttribute('decoding')).toBe('async');
  });

  it('charge tout de suite et en haute priorité l image de l écran prioritaire', () => {
    const image = imageDe(true);

    expect(image.getAttribute('loading')).toBe('eager');
    expect(image.getAttribute('fetchpriority')).toBe('high');
  });
});
