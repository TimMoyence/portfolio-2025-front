import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PresentationComponent } from './presentation.component';

describe('PresentationComponent', () => {
  let component: PresentationComponent;
  let fixture: ComponentFixture<PresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PresentationComponent,
        RouterTestingModule,
        HttpClientTestingModule,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain('Parcours de développement web');
  });

  it('should render key sections and contact CTA', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="technology-section"]')).not.toBeNull();
    expect(compiled.querySelector('[data-testid="highlight-section"]')).not.toBeNull();
    expect(compiled.querySelector('[data-testid="portfolio-section"]')).not.toBeNull();
    expect(compiled.querySelector('app-cta-contact')).not.toBeNull();
  });
});
