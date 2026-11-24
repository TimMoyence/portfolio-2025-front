import { METADONNEES_DU_SITE } from '../../../core/seo/site-servi';
import { texteDe as texte } from '../../../../testing/texte/textes-dom';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  Router,
  type ViewTransitionInfo,
  withComponentInputBinding,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { buildRealisation as realisationDe } from '../../../../testing/factories/realisation.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { routes } from '../../../app.routes';
import { NOM_DU_SITE } from '../../../core/seo/pages/nom-du-site';
import { nomCourt } from '../../../core/seo/noms-courts';
import { NotFoundComponent } from '../../annexes/not-found/not-found.component';
import { ProjetsComponent } from '../projets.component';
import { carteDeRealisation, REALISATIONS } from '../realisations.data';
import { RealisationComponent } from './realisation.component';
import { joueLaTransition, transitionDeVignette } from './transition-de-vignette';

const SLUGS = [
  'atlanticbike',
  'maria-naumenko',
  'asilidesign',
  'innovmind',
  'gestion-de-chais',
  'ifs-academy',
  'zenfirst-renta',
  'morning-brief',
];

const pages = METADONNEES_DU_SITE.pages;

async function ouvrir(url: string): Promise<{ harnais: RouterTestingHarness; page: HTMLElement }> {
  setupTestBed({
    http: false,
    providers: [provideRouter(routes, withComponentInputBinding())],
  });
  const harnais = await RouterTestingHarness.create();
  await harnais.navigateByUrl(url);
  harnais.detectChanges();
  return { harnais, page: harnais.routeNativeElement as HTMLElement };
}

describe('REC-11 · une réalisation se raconte sur sa propre page', () => {
  describe('les routes', () => {
    it('REC-11 · une route par slug, en minuscules, dans l ordre de la liste', () => {
      const chemins = routes
        .map(({ path }) => path ?? '')
        .filter((chemin) => chemin.startsWith('projets/'));

      expect(REALISATIONS.map(({ slug }) => slug)).toEqual(SLUGS);
      expect(chemins).toEqual(SLUGS.map((slug) => `projets/${slug}`));
    });

    it('REC-11 · chaque fiche a son titre « <nom court dans la langue> — Asili Design » et la description de sa carte, en fr et en en', () => {
      for (const realisation of REALISATIONS) {
        const entree = pages.find(({ id }) => id === `projet-${realisation.slug}`);

        expect(entree?.path).withContext(realisation.slug).toBe(`/projets/${realisation.slug}`);
        expect(entree?.index).withContext(realisation.slug).toBeTrue();
        for (const langue of ['fr', 'en']) {
          expect(entree?.locales[langue]?.title)
            .withContext(`${realisation.slug} (${langue})`)
            .toBe(entree && `${nomCourt(entree, langue)} — ${NOM_DU_SITE}`);
        }
        expect(realisation.titre)
          .withContext(realisation.slug)
          .toBe(entree ? nomCourt(entree, 'fr') : '');
        expect(entree?.locales['en']?.description.length)
          .withContext(realisation.slug)
          .toBeGreaterThan(0);
        expect(carteDeRealisation(realisation).desc)
          .withContext(realisation.slug)
          .toBe(entree?.locales['fr']?.description ?? '');
      }
    });
  });

  describe('la fiche', () => {
    for (const [slug, besoin] of [
      ['innovmind', 'app-mobile'],
      ['gestion-de-chais', 'sur-mesure'],
      ['maria-naumenko', 'creer'],
    ] as const) {
      it(`REC-11 · /projets/${slug} suit défi, construit, résultat puis mène au contact avec le besoin ${besoin}`, async () => {
        const { harnais, page } = await ouvrir(`/projets/${slug}`);
        const realisation = realisationDe(slug);
        const parties = [...page.querySelectorAll('section.fiche-partie')].map((partie) => [
          texte(partie.querySelector('h2')),
          texte(partie.querySelector('p')),
        ]);
        const appel = page.querySelector('a.fiche-appel');

        expect(harnais.routeDebugElement?.componentInstance).toBeInstanceOf(RealisationComponent);
        expect(texte(page.querySelector('h1'))).toBe(realisation.titre);
        expect(parties).toEqual([
          ['Le défi', realisation.recit.defi],
          ['Ce que j’ai construit', realisation.recit.construit],
          ['Le résultat', realisation.recit.resultat],
        ]);
        expect(texte(appel)).toBe('Un projet comparable ? Parlons de votre site');
        expect(appel?.getAttribute('href')).toBe(`/contact?besoin=${besoin}`);
      });
    }

    for (const url of ['/projets/inconnu', '/projets/AtlanticBike', '/projets/atlanticbike/plus']) {
      it(`REC-11 · ${url} tombe sur la page introuvable`, async () => {
        const { harnais } = await ouvrir(url);

        expect(harnais.routeDebugElement?.componentInstance).toBeInstanceOf(NotFoundComponent);
      });
    }

    it('REC-11 · une vignette de /projets mène à sa fiche en le signalant à la transition', async () => {
      const { harnais, page } = await ouvrir('/projets');
      const router = TestBed.inject(Router);
      const vignette = page.querySelector<HTMLAnchorElement>(
        'a.proj-link[href="/projets/innovmind"]',
      );
      let etat: unknown;
      const abonnement = router.events.subscribe(() => {
        etat ??= router.getCurrentNavigation()?.extras.state;
      });

      expect(harnais.routeDebugElement?.componentInstance).toBeInstanceOf(ProjetsComponent);
      vignette?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
      );
      await harnais.fixture.whenStable();
      abonnement.unsubscribe();

      expect(router.url).toBe('/projets/innovmind');
      expect(etat).toEqual({ vignette: true });
    });
  });

  describe('la transition', () => {
    const base = {
      depuis: '/projets',
      vers: '/projets/innovmind',
      vignette: true,
      retour: false,
      mouvementReduit: false,
    };

    it('REC-11 · seul le clic sur une vignette, ou le retour depuis une fiche, joue la transition', () => {
      expect(joueLaTransition(base)).toBeTrue();
      expect(joueLaTransition({ ...base, depuis: '/', vers: '/projets/atlanticbike' })).toBeTrue();
      expect(
        joueLaTransition({
          ...base,
          depuis: '/projets/innovmind',
          vers: '/projets',
          vignette: false,
          retour: true,
        }),
      ).toBeTrue();
      expect(joueLaTransition({ ...base, vignette: false })).toBeFalse();
      expect(
        joueLaTransition({ ...base, depuis: '/offer', vers: '/contact', vignette: false }),
      ).toBeFalse();
      expect(
        joueLaTransition({
          ...base,
          depuis: '/projets/innovmind',
          vers: '/contact',
          vignette: false,
          retour: true,
        }),
      ).toBeFalse();
      expect(joueLaTransition({ ...base, vers: '/projets/inconnu' })).toBeFalse();
    });

    it('REC-11 · sous « réduire les animations », aucune transition', () => {
      expect(joueLaTransition({ ...base, mouvementReduit: true })).toBeFalse();
      expect(
        joueLaTransition({
          ...base,
          depuis: '/projets/innovmind',
          vers: '/projets',
          vignette: false,
          retour: true,
          mouvementReduit: true,
        }),
      ).toBeFalse();
    });

    describe('créée par le routeur', () => {
      const snapshot = (chemin: string) =>
        ({
          url: [],
          firstChild: {
            url: chemin
              .split('/')
              .filter(Boolean)
              .map((path) => ({ path })),
            firstChild: null,
          },
        }) as unknown as ActivatedRouteSnapshot;

      function sautee(
        navigation: { trigger: 'imperative' | 'popstate'; extras: { state?: object } },
        depuis: string,
        vers: string,
      ): boolean {
        const transition = {
          ready: Promise.resolve(),
          skipTransition: jasmine.createSpy('skipTransition'),
        };
        TestBed.resetTestingModule();
        setupTestBed({
          http: false,
          providers: [{ provide: Router, useValue: { getCurrentNavigation: () => navigation } }],
        });
        TestBed.runInInjectionContext(() =>
          transitionDeVignette({
            transition: transition as unknown as ViewTransitionInfo['transition'],
            from: snapshot(depuis),
            to: snapshot(vers),
          }),
        );
        return transition.skipTransition.calls.count() === 1;
      }

      it('REC-11 · la navigation /offer → /contact saute la transition', () => {
        expect(sautee({ trigger: 'imperative', extras: {} }, '/offer', '/contact')).toBeTrue();
      });

      it('REC-11 · un popstate qui restaure l état { vignette: true } ne rejoue pas l agrandissement', () => {
        const restauree = { trigger: 'popstate', extras: { state: { vignette: true } } } as const;

        expect(sautee(restauree, '/projets', '/projets/innovmind')).toBeTrue();
        expect(sautee(restauree, '/', '/projets/atlanticbike')).toBeTrue();
      });

      it('REC-11 · tout popstate d une fiche vers une vitrine joue la transition inverse', () => {
        expect(
          sautee({ trigger: 'popstate', extras: {} }, '/projets/innovmind', '/projets'),
        ).toBeFalse();
      });
    });
  });
});
