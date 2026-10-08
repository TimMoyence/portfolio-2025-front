import type { ComponentFixture } from '@angular/core/testing';
import { FormationsListComponent } from './formations-list.component';
import { FORMATION_BENEFITS, FORMATIONS } from './formations-list.data';
import { INSTANTANE_B2_01 } from '../../../testing/fixtures/instantane-b2-01';
import { INSTANTANE_B2_02 } from '../../../testing/fixtures/instantane-b2-02';
import { INSTANTANE_B2_03 } from '../../../testing/fixtures/instantane-b2-03';
import { INSTANTANE_B2_04 } from '../../../testing/fixtures/instantane-b2-04';
import { INSTANTANE_B2_05 } from '../../../testing/fixtures/instantane-b2-05';
import { INSTANTANE_B2_06 } from '../../../testing/fixtures/instantane-b2-06';
import { INSTANTANE_B3_01 } from '../../../testing/fixtures/instantane-b3-01';
import { montagePage } from '../../../testing/montage-page';

const COURS_EN_SEANCE = [
  {
    code: 'B2-01',
    lien: '/formations/b2-01-traitement-information-chiffree',
    instantane: INSTANTANE_B2_01,
  },
  {
    code: 'B2-02',
    lien: '/formations/b2-02-series-statistiques',
    instantane: INSTANTANE_B2_02,
  },
  {
    code: 'B2-03',
    lien: '/formations/b2-03-logique',
    instantane: INSTANTANE_B2_03,
  },
  {
    code: 'B2-04',
    lien: '/formations/b2-04-suites',
    instantane: INSTANTANE_B2_04,
  },
  {
    code: 'B2-05',
    lien: '/formations/b2-05-mathematiques-financieres',
    instantane: INSTANTANE_B2_05,
  },
  {
    code: 'B2-06',
    lien: '/formations/b2-06-exponentielle-logarithme',
    instantane: INSTANTANE_B2_06,
  },
  {
    code: 'B3-01',
    lien: '/formations/b3-01-donnee-brute-decision',
    instantane: INSTANTANE_B3_01,
  },
];

const BADGE_BTS = 'BTS CG · Cours interactif';
const BADGE_BACHELOR = 'Bachelor 3 · Cours interactif';

describe('FormationsListComponent', () => {
  const page = montagePage(FormationsListComponent);
  let component: FormationsListComponent;
  let fixture: ComponentFixture<FormationsListComponent>;

  beforeEach(() => {
    fixture = page();
    component = fixture.componentInstance;
  });

  it('devrait etre cree', () => {
    expect(component).toBeTruthy();
  });

  it('devrait exposer la liste des formations depuis les donnees statiques', () => {
    expect(component['formations']).toBe(FORMATIONS);
    expect(component['formations'].length).toBe(11);
  });

  it('devrait composer les sections Asili (hero, grille, format, bande CTA)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-asili-hero')).not.toBeNull();
    expect(compiled.querySelector('.formation-grid')).not.toBeNull();
    expect(compiled.querySelector('.fo-benefits')).not.toBeNull();
    expect(compiled.querySelector('app-asili-cta-band')).not.toBeNull();
  });

  it('devrait rendre un unique titre de hero (format diapo)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toContain('Du concret');
    expect(headings[0]?.textContent).toContain('format diapo');
  });

  it('devrait rendre visible la formation IA et management sur mesure', () => {
    expect(component['heroLead'].toLowerCase()).toContain('management');
  });

  it('devrait rendre une carte pour chaque formation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.formation-grid .formation');
    expect(cards.length).toBe(FORMATIONS.length);
  });

  it('devrait afficher le titre, la description et le badge de chaque carte', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      expect(compiled.textContent)
        .withContext(`Le titre "${formation.title}" devrait etre visible`)
        .toContain(formation.title);
      expect(compiled.textContent)
        .withContext(`La description de "${formation.title}" devrait etre visible`)
        .toContain(formation.description);
      expect(compiled.textContent)
        .withContext(`Le badge "${formation.badge}" devrait etre visible`)
        .toContain(formation.badge);
    }
  });

  it('devrait afficher les lignes meta de chaque carte', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      for (const row of formation.meta) {
        expect(compiled.textContent).toContain(row.key);
        expect(compiled.textContent).toContain(row.value);
      }
    }
  });

  it("devrait avoir un lien d'action vers la cible de chaque carte", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));
    for (const formation of FORMATIONS) {
      const link = links.find((a) => a.getAttribute('href')?.includes(formation.link));
      expect(link).withContext(`Un lien vers ${formation.link} devrait exister`).toBeTruthy();
    }
  });

  it('devrait inclure la carte bonus toolkit vers la capture email', () => {
    const bonus = FORMATIONS.find((f) => f.variant === 'bonus');
    expect(bonus).toBeDefined();
    expect(bonus?.link).toBe('/formations/ia-solopreneurs/toolkit');

    const compiled = fixture.nativeElement as HTMLElement;
    const bonusCard = compiled.querySelector('.formation.formation--bonus');
    expect(bonusCard).not.toBeNull();
  });

  it('présente en séance exactement les cours du BTS et du Bachelor servis par l API', () => {
    expect(
      FORMATIONS.filter((formation) => formation.variant === 'live').map((carte) => carte.link),
    ).toEqual(COURS_EN_SEANCE.map((cours) => cours.lien));
  });

  it('badge chaque cours en séance du diplôme qu il prépare', () => {
    expect(
      COURS_EN_SEANCE.map(({ code, lien }) => [
        code,
        FORMATIONS.find((formation) => formation.link === lien)?.badge,
      ]),
    ).toEqual(
      COURS_EN_SEANCE.map(({ code }) => [code, code.startsWith('B3') ? BADGE_BACHELOR : BADGE_BTS]),
    );
  });

  for (const { code, lien, instantane } of COURS_EN_SEANCE) {
    describe(`carte du ${code}`, () => {
      const carte = () => FORMATIONS.find((formation) => formation.link === lien);

      it('L1 · ne promet pas de lecture libre, seulement la séance accompagnée', () => {
        expect(carte()?.variant).toBe('live');
        expect(carte()?.title).toContain(code);
        expect(carte()?.description).not.toContain('librement');
        expect(carte()?.description).toContain('À suivre en séance accompagnée');
      });

      it('L1 · n annonce aucun nombre d écrans, qui suit le contenu servi', () => {
        const b2 = carte();
        const annonces = [b2?.badge, b2?.description, ...(b2?.meta.map((row) => row.value) ?? [])];

        expect(annonces.filter((texte) => /\d écrans/.test(texte ?? ''))).toEqual([]);
      });

      it('L1 · annonce la durée du cours réellement servi', () => {
        const annonce = carte()?.meta.find((row) => /^\d+ h \d+$/.test(row.value))?.value ?? '';
        const [, heures, minutes] = /^(\d+) h (\d+)$/.exec(annonce) ?? [];

        expect(
          Math.abs(Number(heures) * 60 + Number(minutes) - instantane.sujet.duree),
        ).toBeLessThan(15);
      });

      it('mène au cours depuis sa carte rendue', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const lienRendu = compiled.querySelector(`.formation.formation--live a[href="${lien}"]`);

        expect(lienRendu).not.toBeNull();
        expect(lienRendu?.closest('.formation')?.textContent).not.toMatch(/\d écrans/);
      });
    });
  }

  it('devrait rendre les trois benefices du format diapo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const benefits = compiled.querySelectorAll('.fo-benefits .fo-benefit');
    expect(benefits.length).toBe(FORMATION_BENEFITS.length);
    for (const benefit of FORMATION_BENEFITS) {
      expect(compiled.textContent).toContain(benefit.title);
      expect(compiled.textContent).toContain(benefit.desc);
    }
  });
});
