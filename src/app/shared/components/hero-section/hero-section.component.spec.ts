import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  let component: HeroSectionComponent;
  let fixture: ComponentFixture<HeroSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSectionComponent);
    component = fixture.componentInstance;
    component.title = 'Test heading';
    component.description = 'A short description';
    component.actions = [
      { label: 'Primary', href: '/presentation' },
      { label: 'Secondary', variant: 'secondary', href: '/contact' },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render provided title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('[data-testid="hero-title"]');
    expect(heading?.textContent).toContain('Test heading');
  });

  it('should render actions', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('a');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Primary');
  });
});
