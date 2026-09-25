import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { rendreLHoteNavigateur } from '../../../../testing/montage-page';
import { decrireRenduServeur, decrireSectionAsili } from '../../../../testing/section-asili';
import { AsiliHeroComponent } from './asili-hero.component';

const KICKER = 'Studio digital & IA · Bordeaux';
const LEAD = 'Developpeur & consultant Angular, NestJS et IA.';

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

  it("rend le titre via inputs avec l'accent italique teal", () => {
    setup();
    fixture.componentRef.setInput('titlePre', 'Clarifier ');
    fixture.componentRef.setInput('accent', 'avant');
    fixture.componentRef.setInput('titlePost', ' de construire.');
    fixture.detectChanges();
    const h1 = fixture.nativeElement.querySelector('h1.hero-title');
    expect(h1).not.toBeNull();
    expect((h1 as HTMLElement).textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Clarifier avant de construire.',
    );
    const accent = (h1 as HTMLElement).querySelector('.accent');
    expect(accent?.textContent).toBe('avant');
  });

  it('affiche la puce live quand `liveChip` est fourni', () => {
    setup();
    fixture.componentRef.setInput('liveChip', KICKER);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.live-chip');
    expect(chip?.textContent).toContain(KICKER);
    expect(chip?.querySelector('.live-dot')).not.toBeNull();
  });

  it('affiche le kicker mono quand `liveChip` est absent', () => {
    setup();
    fixture.componentRef.setInput('kicker', KICKER);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.live-chip')).toBeNull();
    expect(fixture.nativeElement.querySelector('.kicker')?.textContent).toBe(KICKER);
  });

  it("affiche l'accroche et l'indicateur de scroll quand fournis", () => {
    setup();
    fixture.componentRef.setInput('lead', LEAD);
    fixture.componentRef.setInput('scrollHint', 'Defiler');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.lead')?.textContent).toBe(LEAD);
    const scrollHint = fixture.nativeElement.querySelector('.scroll-hint');
    expect(scrollHint).toBeTruthy();
    expect(scrollHint?.querySelector('.bar')).toBeTruthy();
  });

  it('rend les lignes cle/valeur fournies en panneau, sans le filet des statistiques', () => {
    setup();
    fixture.componentRef.setInput('metaRows', [
      { key: 'Format', value: 'Sur-mesure' },
      { key: 'Engagement', value: 'Du ponctuel au continu' },
    ]);
    attachSoGetComputedStyleAppliesTheCascade(fixture);
    fixture.detectChanges();

    const panneau = (fixture.nativeElement as HTMLElement).querySelector(
      '.hero-meta .hero-meta-rows',
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
    expect(getComputedStyle(panneau.querySelector('.row') as HTMLElement).borderLeftWidth).toBe(
      '0px',
    );
    (fixture.nativeElement as HTMLElement).remove();
  });

  it("n'affiche aucun panneau cle/valeur sans lignes", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.hero-meta-rows')).toBeNull();
  });

  it("n'affiche pas l'indication de scroll quand non fournie", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.scroll-hint')).toBeNull();
  });

  decrireRenduServeur(
    monter,
    (hote) => {
      expect(hote.querySelector('h1.hero-title')).not.toBeNull();
    },
    { titlePre: 'Clarifier.' },
  );

  describe('avec projection (page hote)', () => {
    @Component({
      standalone: true,
      imports: [AsiliHeroComponent],
      template: `
        <app-asili-hero>
          <span chip class="live-chip"><span class="live-dot"></span>Projection chip</span>
          <ng-container title
            >Clarifier <span class="accent">avant</span> de construire.
          </ng-container>
          <a cta class="btn btn-teal" href="/services">Voir</a>
          <a cta class="btn btn-ghost" href="/projets">Essayer</a>
          <div meta>
            <div class="n">2</div>
            <div class="l">piliers</div>
          </div>
        </app-asili-hero>
      `,
    })
    class HostComponent {}

    it('projette la puce, le titre, les CTA et la meta fournis par la page', () => {
      const host = rendreLHoteNavigateur(HostComponent);
      expect(host.querySelector('[chip].live-chip')?.textContent).toContain('Projection chip');

      const h1 = host.querySelector('h1.hero-title');
      expect(h1?.querySelector('.accent')?.textContent).toBe('avant');

      const ctas = host.querySelectorAll('.hero-cta a[cta]');
      expect(ctas.length).toBe(2);
      expect((ctas[0] as HTMLAnchorElement).getAttribute('href')).toBe('/services');

      expect(host.querySelector('.hero-meta [meta] .n')?.textContent).toBe('2');
    });

    it('applique le style scope au contenu projete (accent italique teal, meta serif via ::ng-deep)', () => {
      const hostFixture = TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      }).createComponent(HostComponent);
      attachSoGetComputedStyleAppliesTheCascade(hostFixture);
      hostFixture.detectChanges();

      const host = hostFixture.nativeElement as HTMLElement;

      const accent = host.querySelector('.hero-title .accent') as HTMLElement;
      expect(accent).not.toBeNull();
      expect(getComputedStyle(accent).fontStyle).toBe('italic');

      const value = host.querySelector('.hero-meta .n') as HTMLElement;
      expect(value).not.toBeNull();
      expect(getComputedStyle(value).fontSize).toBe('30px');

      const divider = host.querySelector('.hero-meta div') as HTMLElement;
      expect(divider).not.toBeNull();
      expect(getComputedStyle(divider).borderLeftWidth).toBe('1px');

      hostFixture.destroy();
      host.remove();
    });
  });
});
