import { Component } from '@angular/core';
import { rendreLHoteNavigateur } from '../../../../testing/montage-page';
import { ListePucesComponent } from './liste-puces.component';

@Component({
  standalone: true,
  imports: [ListePucesComponent],
  template: `<ul class="hote" [appListePuces]="puces"></ul>`,
})
class HoteListePucesComponent {
  readonly puces = [' Première puce ', ' Seconde puce '];
}

describe('ListePucesComponent', () => {
  it('rend chaque puce dans un <li> directement sous le <ul> hôte, sans boîte intermédiaire', () => {
    const racine = rendreLHoteNavigateur(HoteListePucesComponent);
    const liste = racine.querySelector('ul.hote');
    const items = Array.from(liste?.children ?? []);

    expect(items.map((item) => item.tagName)).toEqual(['LI', 'LI']);
    expect(items.map((item) => item.textContent)).toEqual([' Première puce ', ' Seconde puce ']);
  });
});
