import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CoursBandeauCorrectionComponent } from './cours-bandeau-correction.component';
import type { CorrectionAffichee } from './corrections-affichees';

const HAUTEUR_DE_TOILE = 720;

@Component({
  standalone: true,
  imports: [CoursBandeauCorrectionComponent],
  template: `
    <div data-testid="toile" style="position: relative; width: 1280px; height: 720px">
      <app-cours-bandeau-correction [corrections]="corrections()" [revele]="true" />
    </div>
  `,
})
class ToileDeCorrectionComponent {
  readonly corrections = signal<readonly CorrectionAffichee[]>([]);
}

describe('CoursBandeauCorrectionComponent', () => {
  it('garde une longue correction dans son bandeau, sans déborder de la toile', () => {
    const fixture = TestBed.createComponent(ToileDeCorrectionComponent);
    fixture.componentInstance.corrections.set(
      Array.from({ length: 20 }, (_, rang) => ({
        enonce: `Question ${String(rang + 1)}`,
        bonneReponse: `${String(rang)},5`,
      })),
    );
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    document.body.appendChild(racine);

    const bandeau = racine.querySelector<HTMLElement>('[data-testid="cours-correction"]');
    const toile = racine.querySelector<HTMLElement>('[data-testid="toile"]');
    if (bandeau === null || toile === null) {
      fail('bandeau de correction absent');
      return;
    }
    const cadre = bandeau.getBoundingClientRect();
    expect(cadre.height).toBeLessThanOrEqual(HAUTEUR_DE_TOILE * 0.4 + 1);
    expect(cadre.top).toBeGreaterThanOrEqual(toile.getBoundingClientRect().top);
    expect(bandeau.scrollHeight).toBeLessThanOrEqual(bandeau.clientHeight + 1);
    racine.remove();
  });
});
