import { Component } from '@angular/core';
import { rendreLHoteNavigateur } from '../../../../testing/montage-page';
import { AsiliSectionTeteComponent } from './asili-section-tete.component';

@Component({
  standalone: true,
  imports: [AsiliSectionTeteComponent],
  template: `
    <section class="section-pad" appAsiliSectionTete kicker="Parcours">
      <h2 class="h-lg">Quelques jalons</h2>
      <a class="link-arrow" href="/projets">Voir les projets</a>
      <ol class="corps"></ol>
    </section>
  `,
})
class HoteSectionTeteComponent {}

describe('AsiliSectionTeteComponent', () => {
  let section: Element | null;

  beforeEach(() => {
    section = rendreLHoteNavigateur(HoteSectionTeteComponent).querySelector('section.section-pad');
  });

  it("rend l'en-tete de section directement dans la <section> hote", () => {
    expect(
      section?.querySelector(':scope > .wrap > .sec-head > div > span.kicker')?.textContent,
    ).toBe('Parcours');
    expect(section?.querySelector(':scope > .wrap > .sec-head > div > h2')?.textContent).toBe(
      'Quelques jalons',
    );
  });

  it("place le lien d'en-tete dans .sec-head et le corps apres l'en-tete", () => {
    expect(section?.querySelector(':scope > .wrap > .sec-head > a.link-arrow')).not.toBeNull();
    expect(section?.querySelector(':scope > .wrap > .sec-head + ol.corps')).not.toBeNull();
  });
});
