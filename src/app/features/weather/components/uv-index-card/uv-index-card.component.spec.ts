import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { WeatherLevelService } from '../../services/weather-level.service';
import { UvIndexCardComponent } from './uv-index-card.component';

describe('UvIndexCardComponent', () => {
  let component: UvIndexCardComponent;
  let fixture: ComponentFixture<UvIndexCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UvIndexCardComponent],
      providers: [
        {
          provide: WeatherLevelService,
          useValue: {
            isTooltipSeen: () => true,
            markTooltipSeen: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UvIndexCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait se creer', () => {
    expect(component).toBeTruthy();
  });

  const RISK_CASES: readonly (readonly [number, string, string])[] = [
    [2, 'Faible', 'Faible'],
    [4, 'Mod', 'Modéré'],
    [7, 'lev', 'Élevé'],
    [9, 'lev', 'Très élevé'],
    [12, 'Extr', 'Extrême'],
  ];

  for (const [uvIndex, attendu, libelle] of RISK_CASES) {
    it(`devrait afficher '${libelle}' pour un UV de ${uvIndex}`, () => {
      fixture.componentRef.setInput('uvIndex', uvIndex);
      fixture.detectChanges();
      expect(component.riskLabel()).toContain(attendu);
    });
  }

  it('devrait limiter la position de jauge a 100%', () => {
    fixture.componentRef.setInput('uvIndex', 15);
    fixture.detectChanges();
    expect(component.gaugePosition()).toBe(100);
  });
});
