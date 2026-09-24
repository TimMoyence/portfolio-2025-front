import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { isolateAnimReady } from '../../../../testing/anim-ready';
import { rendreLHoteNavigateur } from '../../../../testing/montage-page';
import { AsiliCtaBandComponent } from './asili-cta-band.component';

const TITLE = 'Et si on clarifiait, ensemble, avant de construire ?';
const LEAD = 'Decrivez votre contexte. Je reviens avec un regard honnete.';

describe('AsiliCtaBandComponent', () => {
  let fixture: ComponentFixture<AsiliCtaBandComponent>;

  function setup(platformId: 'browser' | 'server' = 'browser'): void {
    TestBed.configureTestingModule({
      imports: [AsiliCtaBandComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    fixture = TestBed.createComponent(AsiliCtaBandComponent);
    fixture.componentRef.setInput('title', TITLE);
  }

  isolateAnimReady();

  it('se cree', () => {
    setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('rend le titre dans un <h2>', () => {
    setup();
    fixture.detectChanges();
    const h2 = fixture.nativeElement.querySelector('h2.cta-title');
    expect(h2).not.toBeNull();
    expect((h2 as HTMLElement).textContent?.trim()).toBe(TITLE);
  });

  it('structure la bande avec .cta et .cta-inner', () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cta')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cta .cta-inner')).not.toBeNull();
  });

  it("affiche le kicker et l'accroche quand fournis en inputs", () => {
    setup();
    fixture.componentRef.setInput('kicker', 'Parlons-en');
    fixture.componentRef.setInput('lead', LEAD);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cta-kicker')?.textContent).toContain('Parlons-en');
    expect(fixture.nativeElement.querySelector('.cta-lead')?.textContent).toBe(LEAD);
  });

  it("n'affiche ni kicker ni accroche quand non fournis", () => {
    setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cta-kicker')).toBeNull();
    expect(fixture.nativeElement.querySelector('.cta-lead')).toBeNull();
  });

  it('rend les actions fournies : la principale avec sa fleche, puis la secondaire', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    setup();
    fixture.componentRef.setInput('actions', [
      { libelle: 'Demarrer', lien: '/contact', variante: 'principale' },
      { libelle: 'Explorer', lien: '/projets', variante: 'secondaire' },
    ]);
    fixture.detectChanges();

    const liens = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.cta-actions a'),
    );
    expect(liens.map((lien) => [lien.className, lien.getAttribute('href')])).toEqual([
      ['btn btn-teal', '/contact'],
      ['btn btn-ghost', '/projets'],
    ]);
    expect(liens[0].querySelector('.arrow[aria-hidden="true"]')).not.toBeNull();
    expect(liens[1].querySelector('.arrow')).toBeNull();
    expect(liens.map((lien) => lien.textContent?.trim())).toEqual(['Demarrer →', 'Explorer']);
  });

  it("reste rendu cote serveur (SSR fail-open : pas d'anim-ready)", () => {
    setup('server');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2.cta-title')).not.toBeNull();
    expect(document.documentElement.classList).not.toContain('anim-ready');
  });

  describe('avec projection (page hote)', () => {
    @Component({
      standalone: true,
      imports: [AsiliCtaBandComponent],
      template: `
        <app-asili-cta-band [title]="title">
          <span kicker class="kicker cta-kicker">Slot kicker</span>
          <p lead class="cta-lead">Accroche projetee.</p>
          <a cta class="btn btn-teal" href="/contact">Demarrer</a>
          <a cta class="btn btn-ghost" href="/projets">Explorer</a>
        </app-asili-cta-band>
      `,
    })
    class HostComponent {
      readonly title = TITLE;
    }

    it("projette le kicker, l'accroche et les CTA fournis par la page", () => {
      const host = rendreLHoteNavigateur(HostComponent);
      expect(host.querySelector('.cta-kicker')?.textContent).toContain('Slot kicker');
      expect(host.querySelector('.cta-lead')?.textContent).toContain('Accroche projetee.');

      const actions = host.querySelector('.cta-actions');
      const ctas = actions?.querySelectorAll('a[cta]');
      expect(ctas?.length).toBe(2);
      expect((ctas?.[0] as HTMLAnchorElement).getAttribute('href')).toBe('/contact');
    });
  });
});
