import type { ComponentFixture } from '@angular/core/testing';
import { faqRendue } from '../../../testing/faq-rendue';
import { montagePage } from '../../../testing/montage-page';
import { PresentationComponent } from './presentation.component';

describe('PresentationComponent', () => {
  const page = montagePage(PresentationComponent);
  let component: PresentationComponent;
  let fixture: ComponentFixture<PresentationComponent>;

  beforeEach(() => {
    fixture = page();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a single dev-forward hero title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain('Développeur full-stack & IA.');
  });

  it('should compose the Asili sections (hero, méthode IA, bande CTA)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-asili-hero')).not.toBeNull();
    expect(compiled.querySelector('app-asili-ai-method')).not.toBeNull();
    expect(compiled.querySelector('app-asili-cta-band')).not.toBeNull();
  });

  it('should render the three expertise skills', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skills = compiled.querySelectorAll('.skills-grid .skill');
    expect(skills.length).toBe(3);
  });

  it('should render the career timeline milestones as an ordered list', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('ol.timeline > li.tl-item');
    expect(items.length).toBe(component['milestones'].length);
  });

  it('should render an SSR-safe FAQ with FAQPage microdata', () => {
    faqRendue(fixture.nativeElement, component['closing'].faq.items.length);
  });
});
