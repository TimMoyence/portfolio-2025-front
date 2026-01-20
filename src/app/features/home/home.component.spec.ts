import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule, HttpClientTestingModule],
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
    expect(compiled.querySelector('app-hero-section-home')).not.toBeNull();
    expect(compiled.querySelector('app-services-section')).not.toBeNull();
    expect(compiled.querySelector('app-cta-contact')).not.toBeNull();
  });
});
