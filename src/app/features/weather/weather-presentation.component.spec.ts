import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { WeatherPresentationComponent } from './weather-presentation.component';

describe('WeatherPresentationComponent', () => {
  let fixture: ComponentFixture<WeatherPresentationComponent>;
  let component: WeatherPresentationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherPresentationComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose mock current weather data', () => {
    expect(component.current.temperature_2m).toBe(18);
    expect(component.current.wind_speed_10m).toBe(12);
  });

  it('should expose air quality data with AQI 42', () => {
    expect(component.airQuality.current.european_aqi).toBe(42);
  });

  it('should initialize parallaxOffset to 0', () => {
    expect(component.parallaxOffset).toBe(0);
  });

  it('should default the playable demo to Bordeaux', () => {
    expect(component.activeCityId()).toBe('bordeaux');
    expect(component.city().name).toBe('Bordeaux');
  });

  it('should expose four playable demo cities', () => {
    expect(component.cities.length).toBe(4);
  });

  it('should recompute the demo state when selecting another city', () => {
    component.selectCity('nice');
    expect(component.activeCityId()).toBe('nice');
    expect(component.city().name).toBe('Nice');
    expect(component.needleTransform()).toContain('135');
  });

  it('should render a CTA toward the full weather app', () => {
    const cta = fixture.nativeElement.querySelector('a[href="/atelier/meteo/app"]');
    expect(cta).toBeTruthy();
  });

  it('should render the four city selector buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.city-btn');
    expect(buttons.length).toBe(4);
  });
});
