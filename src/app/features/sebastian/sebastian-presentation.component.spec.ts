import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SebastianPresentationComponent } from './sebastian-presentation.component';

describe('SebastianPresentationComponent', () => {
  let fixture: ComponentFixture<SebastianPresentationComponent>;
  let component: SebastianPresentationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SebastianPresentationComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait initialiser sans crash', () => {
    expect(component).toBeTruthy();
  });

  it('devrait préserver les mock data de présentation', () => {
    expect(component.healthScore.score).toBe(78);
    expect(component.bac.currentBac).toBe(0.12);
    expect(component.badges.length).toBe(10);
  });

  it("devrait exposer un CTA qui mène vers l'app Sebastian", () => {
    const cta = fixture.nativeElement.querySelector('a[href="/atelier/sebastian/app"]');
    expect(cta).toBeTruthy();
  });

  it('devrait exposer quatre habitudes cochables', () => {
    expect(component.habits.length).toBe(4);
  });

  it('devrait calculer le score cible comme somme des poids cochés (plafonné à 100)', () => {
    expect(component.targetScore()).toBe(72);
  });

  it('devrait recalculer le score cible quand on coche une habitude', () => {
    component.toggleHabit('activity');
    expect(component.isChecked('activity')).toBeTrue();
    expect(component.targetScore()).toBe(88);
  });

  it('devrait décocher une habitude déjà cochée et baisser le score cible', () => {
    component.toggleHabit('moderation');
    expect(component.isChecked('moderation')).toBeFalse();
    expect(component.targetScore()).toBe(40);
  });

  it('devrait dériver gaugeOffset de gaugeValue (jauge SSR-safe)', () => {
    const value = component.gaugeValue();
    const expected = 251 - (value / 100) * 251;
    expect(component.gaugeOffset()).toBeCloseTo(expected, 5);
  });

  it("devrait rendre les quatre boutons d'habitude", () => {
    const buttons = fixture.nativeElement.querySelectorAll('.d-habit');
    expect(buttons.length).toBe(4);
  });
});
