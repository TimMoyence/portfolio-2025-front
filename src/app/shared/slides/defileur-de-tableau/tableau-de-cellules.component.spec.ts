import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TableauDeCellulesComponent } from './tableau-de-cellules.component';

@Component({
  standalone: true,
  imports: [TableauDeCellulesComponent],
  template: `<table appTableauDeCellules [entete]="entete" [lignes]="lignes"></table>`,
})
class HoteComponent {
  readonly entete = ['Mois', 'Ventes'];
  readonly lignes = [
    ['Janvier', '120'],
    ['Février', '95'],
  ];
}

describe('TableauDeCellulesComponent', () => {
  it('rend l en-tête en colonnes nommées, puis chaque ligne en cellules, sur le tableau qui le porte', () => {
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.detectChanges();
    const tableau = (fixture.nativeElement as HTMLElement).querySelector('table');
    const textes = (selecteur: string): string[] =>
      [...(tableau?.querySelectorAll(selecteur) ?? [])].map((cellule) =>
        (cellule.textContent ?? '').trim(),
      );

    expect(textes('thead th[scope="col"]')).toEqual(['Mois', 'Ventes']);
    expect(textes('tbody tr').length).toBe(2);
    expect(textes('tbody td')).toEqual(['Janvier', '120', 'Février', '95']);
  });
});
