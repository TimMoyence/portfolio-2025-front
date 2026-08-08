import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { SebastianBadgeStatus } from '../../../core/models/sebastian.model';
import { buildSebastianBadgeStatus } from '../../../../testing/factories/sebastian.factory';
import { SebastianBadgeCardComponent } from './sebastian-badge-card.component';

@Component({
  standalone: true,
  imports: [SebastianBadgeCardComponent],
  template: `<app-sebastian-badge-card [badge]="badge()" />`,
})
class TestHostComponent {
  readonly badge = signal<SebastianBadgeStatus>(buildSebastianBadgeStatus());
}

describe('SebastianBadgeCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait se creer', () => {
    const card = fixture.nativeElement.querySelector('app-sebastian-badge-card');
    expect(card).toBeTruthy();
  });

  const UNLOCKED_BADGE_TEXTS: readonly (readonly [string, string])[] = [
    ['le nom du badge', 'Premiere entree'],
    ['la description du badge', 'Enregistrer sa premiere consommation'],
    ['la date de deblocage', '01/04/2026'],
  ];

  for (const [libelle, attendu] of UNLOCKED_BADGE_TEXTS) {
    it(`devrait afficher ${libelle}`, () => {
      const content = fixture.nativeElement.textContent as string;
      expect(content).toContain(attendu);
    });
  }

  it('devrait afficher un badge debloque avec bordure accent', () => {
    const card: HTMLElement = fixture.nativeElement.querySelector("[data-testid='badge-card']");
    expect(card).toBeTruthy();
    expect(card.classList).toContain('border-gold');
  });

  it('devrait afficher un badge verrouille avec opacite reduite', () => {
    host.badge.set(
      buildSebastianBadgeStatus({
        key: 'streak-7',
        name: 'Semaine parfaite',
        description: '7 jours consecutifs sous objectif',
        category: 'streaks',
        unlocked: false,
        unlockedAt: undefined,
      }),
    );
    fixture.detectChanges();

    const card: HTMLElement = fixture.nativeElement.querySelector("[data-testid='badge-card']");
    expect(card).toBeTruthy();
    expect(card.classList).toContain('opacity-50');
  });

  it('devrait afficher la categorie pour un badge verrouille', () => {
    host.badge.set(
      buildSebastianBadgeStatus({
        unlocked: false,
        category: 'streaks',
        unlockedAt: undefined,
      }),
    );
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('streaks');
  });

  it('devrait afficher l icone PNG du badge', () => {
    const icon = fixture.nativeElement.querySelector(
      "[data-testid='badge-icon']",
    ) as HTMLImageElement | null;
    expect(icon).toBeTruthy();
    expect(icon!.src).toContain('assets/icons/badges/');
    expect(icon!.src).toContain('.png');
  });

  it('devrait ne pas afficher la date pour un badge verrouille', () => {
    host.badge.set(
      buildSebastianBadgeStatus({
        unlocked: false,
        unlockedAt: undefined,
      }),
    );
    fixture.detectChanges();

    const dateEl = fixture.nativeElement.querySelector("[data-testid='badge-date']");
    expect(dateEl).toBeNull();
  });
});
