import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { NewsletterFormComponent } from './newsletter-form.component';

describe('Consentement du bloc Newsletter', () => {
  it('NL-01 · se lit d un seul tenant, lien compris', async () => {
    await setupTestBed({
      http: false,
      router: true,
      imports: [NewsletterFormComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(NewsletterFormComponent);
    fixture.detectChanges();
    const hote: HTMLElement = fixture.nativeElement;

    const consentement = hote.querySelector('[data-newsletter-consentement]')?.closest('label');
    expect(consentement?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'J’accepte de recevoir la newsletter selon la politique de confidentialité.',
    );
  });
});
