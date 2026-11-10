import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { buildEditionRefondue } from '../../../../testing/factories/article.factory';
import { ancresDuSommaire, rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { texteDe, textes } from '../../../../testing/texte/textes-dom';

describe('Les infos à deux niveaux d’une édition', () => {
  beforeAll(() => registerLocaleData(localeFr));

  it('MB-04 · MB-05 · MB-06 · MB-07 · numérote les infos, la première à la une, avec jauge, épisode, pour votre entreprise et sous le capot replié', () => {
    const page = rendreLaFiche(buildEditionRefondue());
    const [une, seconde] = Array.from(page.querySelectorAll<HTMLElement>('#mb-infos .info'));

    expect(une?.id).toBe('mb-info-1');
    expect(texteDe(une?.querySelector('.info__rang'))).toBe('À la une');
    expect(texteDe(une?.querySelector('h3'))).toBe('Claude Code laisse fuiter des secrets');
    expect(texteDe(une?.querySelector('.info__episode'))).toBe(
      'Épisode 3 · Précédemment : Claude Code range ses réglages en clair.',
    );
    expect(texteDe(une?.querySelector('.info__jauge'))).toBe(
      'Pour : Dirigeants · Horizon : Ce trimestre',
    );
    expect(texteDe(une?.querySelector('.info__pour-tous'))).toBe(
      'Des mots de passe ont fuité sur GitHub, enregistrés par l’outil.',
    );
    expect(texteDe(une?.querySelector('.info__entreprise'))).toBe(
      'Pour votre entreprise Vos équipes vérifient leurs dépôts publics cette semaine.',
    );
    const capot = une?.querySelector<HTMLDetailsElement>('details.info__capot');
    expect(texteDe(capot?.querySelector('summary'))).toBe('Sous le capot');
    expect(capot?.open).toBe(false);

    expect(seconde?.id).toBe('mb-info-2');
    expect(texteDe(seconde?.querySelector('.info__rang'))).toBe('Info 2');
    expect(seconde?.querySelector('.info__episode, .info__entreprise, .info__capot')).toBeNull();
    expect(texteDe(seconde?.querySelector('.info__jauge'))).toBe(
      'Pour : Développeurs · Horizon : Aujourd’hui',
    );

    expect(ancresDuSommaire(page)).toContain('mb-info-1');
    expect(textes(page, '.sommaire__libelle')).toContain('Vercel accélère les réponses');
  });
});
