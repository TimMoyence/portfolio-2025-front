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

function monterLaToile(corrections: readonly CorrectionAffichee[]): {
  readonly racine: HTMLElement;
  readonly bandeau: HTMLElement | null;
} {
  const fixture = TestBed.createComponent(ToileDeCorrectionComponent);
  fixture.componentInstance.corrections.set(corrections);
  fixture.detectChanges();
  const racine = fixture.nativeElement as HTMLElement;
  document.body.appendChild(racine);
  return {
    racine,
    bandeau: racine.querySelector<HTMLElement>('[data-testid="cours-correction"]'),
  };
}

describe('CoursBandeauCorrectionComponent', () => {
  it('garde une longue correction dans son bandeau, sans déborder de la toile', () => {
    const { racine, bandeau } = monterLaToile(
      Array.from({ length: 20 }, (_, rang) => ({
        enonce: `Question ${String(rang + 1)}`,
        bonneReponse: `${String(rang)},5`,
      })),
    );
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

  it('QF-17 · garde chaque longue réponse dans sa colonne, sous sa question, sans chevaucher la voisine', () => {
    const { racine, bandeau } = monterLaToile(
      Array.from({ length: 8 }, (_, rang) => ({
        enonce: `Un abonnement coûte 30 € et augmente de 2 € par an. Quelle suite modélise son prix, question ${String(rang + 1)} ?`,
        bonneReponse: 'Géométrique : chaque terme est le précédent multiplié par 1,1',
      })),
    );
    const lignes = [...racine.querySelectorAll<HTMLElement>('.cours-correction__ligne')];
    const debordements = lignes.filter((ligne) => {
      const cadre = ligne.getBoundingClientRect();
      return [...ligne.children].some((cellule) => {
        const bloc = cellule.getBoundingClientRect();
        return bloc.right > cadre.right + 1 || bloc.bottom > cadre.bottom + 1;
      });
    });

    expect(lignes.length).toBe(8);
    expect(debordements.length).toBe(0);
    expect(bandeau?.scrollHeight).toBeLessThanOrEqual((bandeau?.clientHeight ?? 0) + 1);
    expect(bandeau?.scrollWidth).toBeLessThanOrEqual((bandeau?.clientWidth ?? 0) + 1);
    expect(bandeau?.getBoundingClientRect().height).toBeLessThanOrEqual(HAUTEUR_DE_TOILE * 0.6 + 1);
    racine.remove();
  });
});
