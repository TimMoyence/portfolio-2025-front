import { METADONNEES_DU_SITE } from '../../core/seo/site-servi';
import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { delaiDeMiseEnLigne, faqDuSite, prixPlancher } from '../../shared/offre/prix-et-delai';
import { faqRendue } from '../../../testing/page/faq-rendue';
import { pageMontee } from '../../../testing/page/montage-page';
import { OfferComponent } from './offer.component';

const lisible = (valeur: string): string => valeur.replace(/\s+/g, ' ').trim();

const MONTANTS_ET_DELAIS: readonly RegExp[] = [
  /priceSpecification/,
  /"price"/,
  /minPrice/,
  /maxPrice/,
  /\d ?€/,
  /€ ?\d/,
  /\d à \d+ semaines/,
  /\d to \d+ weeks/,
];

const montantsEtDelaisDe = (valeur: unknown): string[] => {
  const json = JSON.stringify(valeur);
  return MONTANTS_ET_DELAIS.filter((forme) => forme.test(json)).map(String);
};

describe('REC-08 · Créer mon site dit le prix, le délai et ce qui est inclus', () => {
  const page = pageMontee(OfferComponent);

  const locale = () => TestBed.inject(LOCALE_ID);

  const formules = () => Array.from(page.racine.querySelectorAll('.formule'));

  it('REC-08 · la page a un seul titre : « Créer mon site »', () => {
    const titres = page.racine.querySelectorAll('h1');

    expect(titres.length).toBe(1);
    expect(texte(titres[0])).toBe('Créer mon site');
  });

  it('REC-08 · trois formules : Site vitrine, Site + réservation, App mobile', () => {
    expect(formules().map((formule) => texte(formule.querySelector('h3')))).toEqual([
      'Site vitrine',
      'Site + réservation',
      'App mobile',
    ]);
  });

  it('REC-08 · le Site vitrine porte le prix et le délai de la constante, les autres sont sur devis', () => {
    const [vitrine, reservation, app] = formules().map((formule) =>
      texte(formule.querySelector('.formule-prix')),
    );

    expect(lisible(vitrine)).toContain(lisible(prixPlancher(locale())));
    expect(vitrine).toContain(delaiDeMiseEnLigne());
    expect(reservation).toBe('Sur devis');
    expect(app).toBe('Sur devis');
  });

  it('REC-08 · chaque formule mène au contact avec son besoin', () => {
    expect(formules().map((formule) => formule.querySelector('a')?.getAttribute('href'))).toEqual([
      '/contact?besoin=creer',
      '/contact?besoin=creer',
      '/contact?besoin=app-mobile',
    ]);
  });

  it('REC-08 · ce qui est inclus se lit en quatre points', () => {
    const inclus = page.racine.querySelector('.inclus');

    expect(texte(inclus?.querySelector('h2'))).toBe('Inclus');
    expect(Array.from(inclus?.querySelectorAll('li') ?? []).map(texte)).toEqual([
      'Rédaction avec vous',
      'Référencement Google & IA',
      'Mise en ligne',
      'Prise en main',
    ]);
  });

  it('REC-08 · le diagnostic gratuit mène à /growth-audit', () => {
    const diagnostic = page.racine.querySelector('a.diagnostic');

    expect(diagnostic?.getAttribute('href')).toBe('/growth-audit');
    expect(texte(diagnostic)).toContain('Diagnostic gratuit de votre site actuel');
  });

  it('REC-08 · la FAQ s ouvre sur prix, délai et après la mise en ligne', () => {
    const attendues = faqDuSite(locale());
    const faq = faqRendue(page.racine, attendues.length + 2);
    const lues = Array.from(faq.querySelectorAll('.faq-item'))
      .slice(0, attendues.length)
      .map((item) => ({
        question: texte(item.querySelector('.faq-q')),
        reponse: lisible(texte(item.querySelector('.faq-a'))),
      }));

    expect(lues).toEqual(
      attendues.map(({ question, reponse }) => ({ question, reponse: lisible(reponse) })),
    );
  });

  it('REC-08 · le SEO de /offer ne porte ni montant ni délai, en français comme en anglais', () => {
    const offre = METADONNEES_DU_SITE.pages.find((candidate) => candidate.id === 'offer');

    const { fr, en } = offre?.locales ?? {};

    expect(fr?.title).toContain('Créer mon site');
    expect(montantsEtDelaisDe(fr)).toEqual([]);
    expect(montantsEtDelaisDe(en)).toEqual([]);
  });
});
