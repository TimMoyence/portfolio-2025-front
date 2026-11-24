import { texteDe } from '../../../../../testing/texte/textes-dom';
import { Component, PLATFORM_ID } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { rendreLHoteNavigateur } from '../../../../../testing/page/montage-page';
import {
  decrireRenduServeur,
  decrireSectionAsili,
} from '../../../../../testing/page/section-asili';
import { AsiliHeroComponent, type MorceauDeTitre } from './asili-hero.component';

const KICKER = 'Création de sites web · Bordeaux';
const LEAD = 'Je crée le site des artisans, commerces et indépendants.';

function attachSoGetComputedStyleAppliesTheCascade(fixture: ComponentFixture<unknown>): void {
  document.body.appendChild(fixture.nativeElement);
}

describe('AsiliHeroComponent', () => {
  let fixture: ComponentFixture<AsiliHeroComponent>;
  const monter = decrireSectionAsili(AsiliHeroComponent);

  function setup(): void {
    fixture = monter();
  }

  it('structure le hero (.hero, .hero-inner, .hero-grid, voile)', () => {
    setup();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('section.hero')).not.toBeNull();
    expect(root.querySelector('.hero .hero-inner')).not.toBeNull();
    expect(root.querySelector('.hero-inner .hero-grid')).not.toBeNull();
    expect(root.querySelector('.hero-veil')).not.toBeNull();
  });

  it('affiche le kicker fourni, sans point ni barre animés', () => {
    setup();
    fixture.componentRef.setInput('kicker', KICKER);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.kicker')?.textContent).toBe(KICKER);
    expect(fixture.nativeElement.querySelector('.live-dot, .scroll-hint')).toBeNull();
  });

  it("affiche l'accroche fournie", () => {
    setup();
    fixture.componentRef.setInput('lead', LEAD);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lead')?.textContent).toBe(LEAD);
  });

  it('rend les lignes cle/valeur fournies en panneau, sans filet', () => {
    setup();
    fixture.componentRef.setInput('metaRows', [
      { key: 'Format', value: 'Sur-mesure' },
      { key: 'Engagement', value: 'Du ponctuel au continu' },
    ]);
    attachSoGetComputedStyleAppliesTheCascade(fixture);
    fixture.detectChanges();

    const panneau = (fixture.nativeElement as HTMLElement).querySelector(
      '.hero-sub .hero-meta-rows',
    ) as HTMLElement;
    expect(panneau).not.toBeNull();
    const lignes = Array.from(panneau.querySelectorAll('.row')).map((row) => [
      row.querySelector('.k')?.textContent,
      row.querySelector('.v')?.textContent,
    ]);
    expect(lignes).toEqual([
      ['Format', 'Sur-mesure'],
      ['Engagement', 'Du ponctuel au continu'],
    ]);
    expect(getComputedStyle(panneau).borderLeftWidth).toBe('0px');
    (fixture.nativeElement as HTMLElement).remove();
  });

  it("n'affiche aucun panneau cle/valeur sans lignes, ni zone de visuel vide", () => {
    setup();
    attachSoGetComputedStyleAppliesTheCascade(fixture);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.hero-meta-rows')).toBeNull();
    expect(getComputedStyle(racine.querySelector('.hero-visuel') as HTMLElement).display).toBe(
      'none',
    );
    racine.remove();
  });

  function motsEtLignes(titre: readonly MorceauDeTitre[]): {
    mots: (string | null)[];
    lignes: string[];
    accents: (string | null)[];
  } {
    setup();
    fixture.componentRef.setInput('titre', titre);
    fixture.detectChanges();
    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1') as HTMLElement;
    const copie = h1.cloneNode(true) as HTMLElement;
    copie.querySelectorAll('br').forEach((saut) => saut.replaceWith('\n'));
    return {
      mots: [...h1.querySelectorAll('.mot')].map((mot) => mot.textContent),
      lignes: (copie.textContent ?? '')
        .split('\n')
        .map((ligne) => ligne.replace(/\s+/g, ' ').trim()),
      accents: [...h1.querySelectorAll('.accent')].map((accent) => accent.textContent),
    };
  }

  it('passe à la ligne avant un morceau aLaLigne et colle la ponctuation à l accent', () => {
    expect(
      motsEtLignes([
        { texte: 'Des preuves,' },
        { texte: 'pas des ', aLaLigne: true },
        { texte: 'promesses', accent: true },
        { texte: '.' },
      ]),
    ).toEqual({
      mots: ['Des', 'preuves,', 'pas', 'des', 'promesses.'],
      lignes: ['Des preuves,', 'pas des promesses.'],
      accents: ['promesses'],
    });
  });

  it('un morceau fait d une espace sépare deux mots sans créer de mot vide', () => {
    expect(
      motsEtLignes([{ texte: 'Manager' }, { texte: ' ' }, { texte: 'avant tout.', accent: true }]),
    ).toEqual({
      mots: ['Manager', 'avant', 'tout.'],
      lignes: ['Manager avant tout.'],
      accents: ['avant', 'tout.'],
    });
  });

  it('un premier morceau aLaLigne n ouvre pas le titre sur une ligne vide', () => {
    expect(motsEtLignes([{ texte: 'Des idées', aLaLigne: true }]).lignes).toEqual(['Des idées']);
  });

  decrireRenduServeur(
    monter,
    (hote) => {
      expect(hote.querySelector('h1.hero-title')).not.toBeNull();
    },
    { kicker: KICKER },
  );

  describe('avec projection (page hote)', () => {
    @Component({
      standalone: true,
      imports: [AsiliHeroComponent],
      template: `
        <app-asili-hero [titre]="titre">
          <a cta class="btn btn-teal" href="/contact">Parler</a>
          <a cta class="btn btn-ghost" href="/projets">Voir</a>
          <figure visuel class="capture">
            <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Capture" />
          </figure>
        </app-asili-hero>
      `,
    })
    class HostComponent {
      protected readonly titre: readonly MorceauDeTitre[] = [
        { texte: 'Votre métier mérite ' },
        { texte: 'mieux', accent: true },
        { texte: '.' },
      ];
    }

    it('rend le titre mot par mot, projette les CTA et le visuel fournis par la page', () => {
      const host = rendreLHoteNavigateur(HostComponent);

      expect(host.querySelector('h1.hero-title .accent')?.textContent).toBe('mieux');
      expect([...host.querySelectorAll('h1 .mot')].map((mot) => mot.textContent)).toEqual([
        'Votre',
        'métier',
        'mérite',
        'mieux.',
      ]);
      expect(texteDe(host.querySelector('h1'))).toBe('Votre métier mérite mieux.');
      expect(
        [...host.querySelectorAll('.hero-cta a[cta]')].map((lien) => lien.getAttribute('href')),
      ).toEqual(['/contact', '/projets']);
      expect(host.querySelector('.hero-visuel figure.capture img')?.getAttribute('alt')).toBe(
        'Capture',
      );
    });

    it('applique le style scope au titre projete et place le visuel en seconde colonne', () => {
      const hostFixture = TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      }).createComponent(HostComponent);
      attachSoGetComputedStyleAppliesTheCascade(hostFixture);
      hostFixture.detectChanges();
      const host = hostFixture.nativeElement as HTMLElement;

      expect(
        getComputedStyle(host.querySelector('.hero-title .accent') as HTMLElement).fontStyle,
      ).toBe('italic');
      expect(getComputedStyle(host.querySelector('.hero-visuel') as HTMLElement).display).not.toBe(
        'none',
      );

      hostFixture.destroy();
      host.remove();
    });
  });
});
