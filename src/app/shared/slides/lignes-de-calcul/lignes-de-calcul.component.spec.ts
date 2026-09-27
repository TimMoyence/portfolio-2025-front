import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { LignesDeCalculComponent } from './lignes-de-calcul.component';

@Component({
  standalone: true,
  imports: [LignesDeCalculComponent],
  template: `<p class="texte" [appLignesDeCalcul]="texte()"></p>`,
})
class HoteComponent {
  readonly texte = input.required<string>();
}

function monter(texte: string): HTMLElement {
  const fixture = TestBed.createComponent(HoteComponent);
  fixture.componentRef.setInput('texte', texte);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.texte') as HTMLElement;
}

describe('LignesDeCalculComponent', () => {
  beforeEach(() => setupTestBed({ http: false, imports: [HoteComponent] }));

  it('écran 58 · affiche chaque calcul d une correction sur sa propre ligne', () => {
    const texte = monter(
      'Marge de la marketplace : 523 000 × 0,16 = 83 680 €, soit 83 680 ÷ 291 000 ≈ 28,8 % de la marge.',
    );
    const lignes = [...texte.querySelectorAll<HTMLElement>('.ligne-de-calcul')];

    expect(lignes.map((ligne) => ligne.textContent)).toEqual([
      'Marge de la marketplace :',
      '523 000 × 0,16 = 83 680 €,',
      'soit 83 680 ÷ 291 000 ≈ 28,8 % de la marge.',
    ]);
    expect(lignes.every((ligne) => getComputedStyle(ligne).display === 'block')).toBeTrue();
    texte.parentElement?.remove();
  });
});
