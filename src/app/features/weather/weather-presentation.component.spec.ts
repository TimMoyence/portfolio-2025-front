import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WeatherPresentationComponent } from "./weather-presentation.component";

describe("WeatherPresentationComponent", () => {
  let component: WeatherPresentationComponent;
  let fixture: ComponentFixture<WeatherPresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherPresentationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });
});
