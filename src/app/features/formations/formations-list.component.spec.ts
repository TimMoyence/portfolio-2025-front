import type { ComponentFixture } from '@angular/core/testing';
import { FormationsListComponent } from './formations-list.component';
import { FORMATION_BENEFITS, FORMATIONS } from './formations-list.data';
import { INSTANTANE_B2_01 } from '../../../testing/fixtures/instantane-b2-01';
import { montagePage } from '../../../testing/montage-page';

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
    expect(component['formations'].length).toBe(5);
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

  it('L1 · ne promet plus de lecture libre du B2-01, seulement la séance accompagnée', () => {
    const b2 = FORMATIONS.find((formation) => formation.variant === 'live');

    expect(b2?.description).not.toContain('librement');
    expect(b2?.description).toContain('À suivre en séance accompagnée');
  });

  it('L1 · n annonce aucun nombre d écrans, qui suit le contenu servi', () => {
    const b2 = FORMATIONS.find((formation) => formation.variant === 'live');
    const annonces = [b2?.badge, b2?.description, ...(b2?.meta.map((row) => row.value) ?? [])];

    expect(annonces.filter((texte) => /\d écrans/.test(texte ?? ''))).toEqual([]);
  });

  it('L1 · annonce la durée du cours réellement servi', () => {
    const b2 = FORMATIONS.find((formation) => formation.variant === 'live');
    const annonce = b2?.meta.find((row) => /^\d+ h \d+$/.test(row.value))?.value ?? '';
    const [, heures, minutes] = /^(\d+) h (\d+)$/.exec(annonce) ?? [];
    const { duree } = INSTANTANE_B2_01.sujet;

    expect(Math.abs(Number(heures) * 60 + Number(minutes) - duree)).toBeLessThan(15);
  });

  it('devrait mener au cours B2-01 public et annoncer le déroulé réellement servi', () => {
    const b2 = FORMATIONS.find((formation) => formation.variant === 'live');

    expect(b2).toBeDefined();
    expect(b2?.link).toBe('/formations/b2-01-traitement-information-chiffree');
    expect(b2?.title).toContain('B2-01');
    expect(b2?.meta.some((row) => row.value === '3 h 30')).toBeTrue();

    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('.formation.formation--live');
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('3 h 30');
    expect(card?.textContent).not.toMatch(/\d écrans/);
    expect(card?.querySelector('a')?.getAttribute('href')).toBe(
      '/formations/b2-01-traitement-information-chiffree',
    );
  });

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
