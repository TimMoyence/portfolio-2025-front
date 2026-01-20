import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ClientProjectComponent } from './client-project.component';

describe('ClientProjectComponent', () => {
  let component: ClientProjectComponent;
  let fixture: ComponentFixture<ClientProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClientProjectComponent,
        RouterTestingModule,
        HttpClientTestingModule,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain('Mes projets web réalisés');
  });

  it('should render case studies, feature, highlight and contact CTA', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="case-studies-section"]')).not.toBeNull();
    expect(compiled.querySelector('[data-testid="feature-section"]')).not.toBeNull();
    expect(compiled.querySelector('[data-testid="highlight-section"]')).not.toBeNull();
    expect(compiled.querySelector('app-cta-contact')).not.toBeNull();
  });
});
