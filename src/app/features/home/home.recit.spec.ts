import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { pageMontee } from '../../../testing/page/montage-page';
import { ENTREES_DE_FORMATION } from '../../core/config/familles-de-formation';
import { faqDuSite } from '../../shared/offre/prix-et-delai';
import { HomeComponent } from './home.component';

describe('REC-06 · l accueil raconte l histoire du client dans l ordre', () => {
  const page = pageMontee(HomeComponent);
  const section = (classe: string): Element =>
    page.racine.querySelector(`section.${classe}`) as Element;

  it('REC-06 · problème, guide, plan, réalisations, formation, FAQ, appel final', () => {
    expect([...page.racine.querySelectorAll('h2')].map(texte)).toEqual([
      'Un site qui ne dit rien ne vous rapporte rien.',
      'Je suis Tim, et j’explique sans jargon.',
      'Trois étapes, et votre site est en ligne.',
      'Des réalisations, pas des promesses.',
      'Après la mise en ligne, je vous rends autonome.',
      'Vos questions, avant de vous lancer.',
      'Parlons de votre site.',
    ]);
  });

  it('REC-06 · le problème : un site muet, introuvable, qui ne fait pas appeler', () => {
    expect([...section('probleme').querySelectorAll('li')].map(texte)).toEqual([
      'Il ne dit pas ce que vous faites.',
      'On ne le trouve pas.',
      'Il ne fait pas appeler.',
    ]);
  });

  it('REC-06 · le guide : manager chez Decathlon, formateur Ipac & EPSI, sans jargon', () => {
    const guide = texte(section('guide'));

    expect(guide).toContain('Six ans manager chez Decathlon');
    expect(guide).toContain('formateur à l’Ipac et à l’EPSI');
    expect(guide).toContain('J’enseigne, donc j’explique sans jargon.');
  });

  it('REC-06 · le plan en trois étapes', () => {
    expect([...page.racine.querySelectorAll('app-asili-method .step h3')].map(texte)).toEqual([
      'On se parle',
      'Je raconte et je construis',
      'Vous êtes en ligne, et autonome',
    ]);
  });

  it('REC-06 · la formation mène aux deux entrées du menu, mêmes libellés et mêmes nombres', () => {
    const entrees = [...section('formation').querySelectorAll('a.formation-entree')].map((lien) => [
      texte(lien.querySelector('h3')),
      texte(lien.querySelector('p')),
      lien.getAttribute('href'),
    ]);

    expect(entrees).toEqual(
      ENTREES_DE_FORMATION.map(({ titre, detail, lien }) => [titre, detail, lien]),
    );
  });

  it('REC-06 · la FAQ des objections lit la liste unique du prix, du délai et de l après', () => {
    const faq = [...page.racine.querySelectorAll('app-asili-faq .faq-item')].map((item) => [
      texte(item.querySelector('.faq-q')),
      texte(item.querySelector('.faq-a')),
    ]);

    expect(faq).toEqual(
      faqDuSite(TestBed.inject(LOCALE_ID)).map(({ question, reponse }) => [question, reponse]),
    );
  });

  it('REC-06 · l appel final mène au contact avec le besoin « creer »', () => {
    const appel = page.racine.querySelector('app-asili-cta-band a.btn-teal');

    expect(appel?.getAttribute('href')).toBe('/contact?besoin=creer');
  });

  it('REC-06 · plus de piliers « à parts égales »', () => {
    expect(page.racine.querySelector('app-asili-pillars')).toBeNull();
    expect(texte(page.racine)).not.toContain('à parts égales');
  });
});
