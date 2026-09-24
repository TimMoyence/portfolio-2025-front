import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { ArticlesCtaComponent } from './articles-cta.component';

describe('ArticlesCtaComponent', () => {
  it('porte l accroche recue et renvoie vers le formulaire de contact', () => {
    setupTestBed({ imports: [ArticlesCtaComponent], router: true });
    const fixture = TestBed.createComponent(ArticlesCtaComponent);
    fixture.componentRef.setInput('kicker', 'Accroche');
    fixture.componentRef.setInput('title', 'Titre');
    fixture.componentRef.setInput('lead', 'Chapeau');
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.textContent).toContain('Titre');
    expect(racine.querySelector('a.btn-teal')?.getAttribute('href')).toBe('/contact');
  });
});
