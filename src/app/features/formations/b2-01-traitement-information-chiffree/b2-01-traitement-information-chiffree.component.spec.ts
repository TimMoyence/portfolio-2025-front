import { HttpTestingController } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { CoursCatalogue } from '../../../../cours/content/types';
import { briqueMontee } from '../../../../testing/briques-montees';
import {
  buildEcran,
  buildEcranQuestionnaire,
  buildNumericQuestion,
} from '../../../../testing/factories/cours.factory';
import { FORMATION_CATALOGUE_PORT } from '../../../core/ports/formation-catalogue.port';
import {
  buildVisualCourse,
  createFormationCataloguePortStub,
} from '../../../../testing/factories/formation-catalogue.factory';
import {
  buildVisualImageHeroSlide,
  buildVisualQuizSlide,
} from '../../../../testing/factories/visual-slide.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { buildAuthSession, buildAuthUser } from '../../../../testing/factories/auth.factory';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { B2TraitementInformationChiffreeComponent } from './b2-01-traitement-information-chiffree.component';

describe('B2TraitementInformationChiffreeComponent', () => {
  const catalogue = createFormationCataloguePortStub();

  beforeEach(() => {
    catalogue.lire.and.returnValue(of(buildVisualCourse()));
    setupTestBed({
      router: true,
      imports: [B2TraitementInformationChiffreeComponent],
      providers: [{ provide: FORMATION_CATALOGUE_PORT, useValue: catalogue }],
    });
  });

  it('compose les 72 écrans du catalogue serveur dans le deck partagé', () => {
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(catalogue.lire).toHaveBeenCalledWith('b2-01-traitement-information-chiffree');
    expect(element.querySelector('app-slide-deck')).not.toBeNull();
    expect(element.querySelectorAll('section.slide')).toHaveSize(72);
    expect(element.querySelector('app-slide-hero')).not.toBeNull();
    expect(element.textContent).toContain('Lire un chiffre');
  });

  it('présente les quiz du catalogue en aperçu, sans promettre un résultat de séance', () => {
    catalogue.lire.and.returnValue(of(buildVisualCourse({ ecrans: [buildVisualQuizSlide()] })));
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.slide-quiz__option')?.click();
    fixture.detectChanges();

    expect(element.querySelector('[data-testid="slide-quiz-apercu"]')).not.toBeNull();
    expect(element.textContent).not.toContain('Le résultat vient de la séance');
  });

  it('montre une erreur utile si le catalogue ne répond pas, sans créer un deuxième deck', () => {
    catalogue.lire.and.returnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.querySelector('app-slide-deck')).toBeNull();
  });

  it('ne charge en priorité que l’image du premier écran', () => {
    catalogue.lire.and.returnValue(
      of(
        buildVisualCourse({
          ecrans: [
            buildVisualImageHeroSlide('B2-01-S01-ACCROCHE'),
            buildVisualImageHeroSlide('B2-01-S02-SUITE'),
          ],
        }),
      ),
    );
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const images = (fixture.nativeElement as HTMLElement).querySelectorAll('.slide-hero__bg img');
    expect(images).toHaveSize(2);
    expect(images[0].getAttribute('loading')).toBe('eager');
    expect(images[0].getAttribute('fetchpriority')).toBe('high');
    expect(images[1].getAttribute('loading')).toBe('lazy');
    expect(images[1].hasAttribute('fetchpriority')).toBeFalse();
  });

  describe('écrans runtime du catalogue (F21, AC-28)', () => {
    const ecrans = [
      buildEcran({
        id: 'b2-01-estimation',
        type: 'fp-numeric',
        titre: 'Estimer avant de calculer',
        duree: 4,
        donnees: { question: buildNumericQuestion() },
      }),
      buildEcranQuestionnaire({ id: 'b2-01-atelier-1', titre: 'Atelier 1' }),
      buildEcran({
        id: 'b2-01-verrou',
        type: 'ecran-verrouille',
        titre: 'Tâche de tableur 2',
        duree: 11,
      }),
    ];

    async function monterLaPage(): Promise<
      ComponentFixture<B2TraitementInformationChiffreeComponent>
    > {
      catalogue.lire.and.returnValue(of(buildVisualCourse({ ecrans })));
      const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
      fixture.detectChanges();
      await briqueMontee(fixture, 'fp-vote');
      return fixture;
    }

    it('monte les briques des écrans catalogue en aperçu, en rendu main', async () => {
      const fixture = await monterLaPage();
      const numerique = await briqueMontee(fixture, 'fp-numeric');

      expect(numerique.hasAttribute('data-apercu')).toBeTrue();
      expect(numerique.getAttribute('render')).toBe('hand');
      expect(numerique.getAttribute('data-cours-role')).toBe('etudiant');
      expect(
        (fixture.nativeElement as HTMLElement).querySelectorAll('fp-numeric, fp-vote').length,
      ).toBe(3);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          '[data-testid="slide-activity-error"]',
        ),
      ).toBeNull();
    });

    it('titre chaque écran, verrouillé compris, avec sa durée', async () => {
      const element = (await monterLaPage()).nativeElement as HTMLElement;
      const resumes = [...element.querySelectorAll('[data-testid="b2-ecran-resume"]')].map(
        (entete) =>
          [...entete.children].map((ligne) => ligne.textContent?.replace(/\s+/g, ' ').trim()),
      );

      expect(resumes).toEqual([
        ['Estimer avant de calculer', '4 min'],
        ['Atelier 1', '14 min'],
      ]);
      expect(
        element
          .querySelector('[data-testid="slide-activity-verrouille"]')
          ?.textContent?.replace(/\s+/g, ' '),
      ).toContain('Tâche de tableur 2');
      expect(element.querySelector('[data-testid="b2-apercu"]')?.textContent).toContain(
        'les réponses ne s’envoient que pendant une séance',
      );
    });

    it('n envoie aucune requête de séance quand un visiteur répond en aperçu', async () => {
      const fixture = await monterLaPage();
      const numerique = await briqueMontee(fixture, 'fp-numeric');
      const champ = numerique.shadowRoot?.querySelector<HTMLInputElement>('[data-testid="champ"]');
      if (champ) {
        champ.value = '12';
        champ.dispatchEvent(new Event('input'));
      }
      numerique.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="valider"]')?.click();

      expect(numerique.shadowRoot?.querySelector('[data-testid="retour"]')?.textContent).toBe(
        'Aperçu : les réponses s’envoient pendant la séance',
      );
      TestBed.inject(HttpTestingController).verify();
    });
  });

  describe('version publiée servie par le catalogue', () => {
    it('affiche la version et la date de bascule servies par le back', () => {
      catalogue.lire.and.returnValue(
        of(
          buildVisualCourse({
            version: 4,
            publieLe: '2026-09-15T09:30:00.000Z',
            ecrans: [buildVisualImageHeroSlide('B2-01-S01-ACCROCHE')],
          }),
        ),
      );
      const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
      fixture.detectChanges();

      const publication = (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="b2-publication"]',
      );
      expect(publication?.textContent).toContain('4');
      expect(publication?.querySelector('time')?.getAttribute('datetime')).toBe(
        '2026-09-15T09:30:00.000Z',
      );
    });

    it('ne promet aucune version quand le serveur n en sert pas encore', () => {
      const brut: Record<string, unknown> = {
        ...buildVisualCourse({ ecrans: [buildVisualImageHeroSlide('B2-01-S01-ACCROCHE')] }),
      };
      delete brut['version'];
      delete brut['publieLe'];
      catalogue.lire.and.returnValue(of(brut as unknown as CoursCatalogue));
      const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('[data-testid="b2-publication"]')).toBeNull();
      expect(element.querySelector('app-slide-deck')).not.toBeNull();
    });
  });

  it('propose de rejoindre une séance accompagnée, même quand le catalogue est indisponible', () => {
    catalogue.lire.and.returnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const lien = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '[data-testid="b2-rejoindre-seance"]',
    );
    expect(lien?.getAttribute('href')).toBe('/cours/rejoindre');
    expect(lien?.textContent).toContain('Rejoindre une séance');
  });

  it('détecte le rôle formateur et ouvre le pupitre pour créer le code étudiant', () => {
    TestBed.inject(AuthStateService).login(
      buildAuthSession({ user: buildAuthUser({ roles: ['teacher'] }) }),
    );
    const fixture = TestBed.createComponent(B2TraitementInformationChiffreeComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const pupitre = element.querySelector<HTMLAnchorElement>('[data-testid="b2-ouvrir-pupitre"]');

    expect(pupitre?.getAttribute('href')).toBe(
      '/cours/presenter/b2-01-traitement-information-chiffree',
    );
    expect(pupitre?.textContent).toContain('Ouvrir l’espace formateur');
    expect(element.querySelector('[data-testid="b2-rejoindre-seance"]')).toBeNull();
    expect(element.textContent).toContain('obtenir le code à donner à vos étudiants');
  });
});
