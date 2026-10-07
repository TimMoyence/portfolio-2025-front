import { TestBed } from '@angular/core/testing';
import { SlideIllustrationComponent } from './slide-illustration.component';

describe('SlideIllustrationComponent', () => {
  it('pose l image seule dans une figure, sans titre ni texte', () => {
    const fixture = TestBed.createComponent(SlideIllustrationComponent);
    fixture.componentRef.setInput('image', '/assets/cours/b2-02/v2/cinq-factures.webp');
    fixture.componentRef.setInput('imageAlt', 'Schéma des cinq factures');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const figure = element.querySelector('figure.slide-illustration');

    expect(figure?.children.length).toBe(1);
    expect(figure?.querySelector('img')?.getAttribute('alt')).toBe('Schéma des cinq factures');
    expect(element.textContent?.trim()).toBe('');
  });
});
