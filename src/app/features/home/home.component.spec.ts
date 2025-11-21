import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the composed sections including contact and footer', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('app-hero-section')).not.toBeNull();
    expect(compiled.querySelector('app-services-section')).not.toBeNull();
    expect(compiled.querySelector('app-contact')).not.toBeNull();
    expect(compiled.querySelector('app-footer')).not.toBeNull();
  });
});
