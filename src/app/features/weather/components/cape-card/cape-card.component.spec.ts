import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AUTH_PORT } from '../../../../core/ports/auth.port';
import { WEATHER_PORT } from '../../../../core/ports/weather.port';
import { createAuthPortStub } from '../../../../../testing/factories/auth.factory';
import {
  buildWeatherPreferences,
  createWeatherPortStub,
} from '../../../../../testing/factories/weather.factory';
import { WeatherLevelService } from '../../services/weather-level.service';
import { UnitPreferencesService } from '../../services/unit-preferences.service';
import { CapeCardComponent } from './cape-card.component';

describe('CapeCardComponent', () => {
  let component: CapeCardComponent;
  let fixture: ComponentFixture<CapeCardComponent>;

  beforeEach(async () => {
    const weatherPortStub = createWeatherPortStub();
    const authPortStub = createAuthPortStub();

    weatherPortStub.getPreferences.and.returnValue(of(buildWeatherPreferences()));
    weatherPortStub.updatePreferences.and.returnValue(of(buildWeatherPreferences()));

    authPortStub.login.and.returnValue(of(null));
    authPortStub.register.and.returnValue(of(null));
    authPortStub.me.and.returnValue(of(null));
    authPortStub.googleAuth.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [CapeCardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: authPortStub },
        { provide: WEATHER_PORT, useValue: weatherPortStub },
        WeatherLevelService,
        UnitPreferencesService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CapeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait se creer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait avoir une valeur CAPE nulle par defaut', () => {
    expect(component.cape()).toBeNull();
  });

  const INSTABILITY_CASES: readonly (readonly [number, string, string])[] = [
    [200, 'Stable', 'CAPE < 500'],
    [750, 'marginale', 'CAPE entre 500 et 1000'],
    [1500, 'mod', 'CAPE entre 1000 et 2000'],
    [2500, 'forte', 'CAPE entre 2000 et 3000'],
    [3500, 'extr', 'CAPE >= 3000'],
  ];

  for (const [cape, attendu, contexte] of INSTABILITY_CASES) {
    it(`devrait afficher '${attendu}' pour un ${contexte}`, () => {
      fixture.componentRef.setInput('cape', cape);
      fixture.detectChanges();
      expect(component.instabilityLabel()).toContain(attendu);
    });
  }

  it('devrait limiter la position de jauge a 100%', () => {
    fixture.componentRef.setInput('cape', 5000);
    fixture.detectChanges();
    expect(component.gaugePosition()).toBe(100);
  });

  it('devrait retourner une position de jauge a 0 pour un CAPE null', () => {
    expect(component.gaugePosition()).toBe(0);
  });
});
