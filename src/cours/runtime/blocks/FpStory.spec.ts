import { ROLES_DE_MONTAGE } from '../../../testing/briques-montees';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildStoryRecit } from '../../../testing/factories/cours.factory';
import { FpStory, type StoryVideo } from './FpStory';

const RECIT = buildStoryRecit();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 8;
const VIDEO: StoryVideo = {
  src: 'https://example.com/rappel.webm',
  type: 'video/webm',
  titre: 'Rappel du calcul',
  poster: '#',
  transcript: 'Partie divisée par total puis convertie en pourcentage.',
  source: 'https://example.com/source',
  licence: 'CC BY-SA 4.0',
};

function marque(element: FpStory, repere: string): Element | null {
  return element.shadowRoot?.querySelector(`[data-testid="${repere}"]`) ?? null;
}

function paragraphes(element: FpStory): string[] {
  const trouves = element.shadowRoot?.querySelectorAll('[data-testid="paragraphe"]') ?? [];
  return [...trouves].map((noeud) => noeud.textContent?.trim() ?? '');
}

describe('FpStory', () => {
  let hote: FpStory;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-story')) {
      customElements.define('fp-story', FpStory);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-story') as FpStory;
    traces = surveillerEffets(hote);
    hote.recit = RECIT;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('pose le recit dans un aside et non dans un div nu', () => {
    const cadre = hote.shadowRoot?.querySelector('.fp-story__recit');
    expect(cadre?.tagName).toBe('ASIDE');
    expect(marque(hote, 'titre')?.tagName).toBe('H2');
    expect(marque(hote, 'titre')?.textContent?.trim()).toBe(RECIT.titre);
  });

  it('rend un paragraphe par fragment du recit, dans l ordre recu', () => {
    expect(paragraphes(hote)).toEqual([...RECIT.paragraphes]);
  });

  it('copie les paragraphes recus et ignore une mutation ulterieure de la source', () => {
    const source = ['Premier temps du recit', 'Second temps du recit'];
    hote.recit = buildStoryRecit({ id: 'R-RECIT-04', paragraphes: source });
    source.push('Ajout apres coup');
    expect(hote.recit?.paragraphes).toEqual(['Premier temps du recit', 'Second temps du recit']);
    expect(paragraphes(hote).length).toBe(2);
  });

  it('echappe le html injecte dans le titre et dans les paragraphes', () => {
    hote.recit = buildStoryRecit({
      id: 'R-RECIT-05',
      titre: CHARGE_XSS,
      paragraphes: [CHARGE_XSS],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(marque(hote, 'titre')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(paragraphes(hote)).toEqual([CHARGE_XSS]);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('rend le visuel autorise avec son texte alternatif et sa legende', () => {
    hote.recit = {
      ...RECIT,
      visuel: {
        src: '#',
        alt: 'Tableau de données',
        legende: 'Lire la donnée avant de la calculer.',
      },
    };
    const visuel = marque(hote, 'visuel');
    expect(visuel?.querySelector('img')?.getAttribute('src')).toBe('#');
    expect(visuel?.querySelector('img')?.getAttribute('alt')).toBe('Tableau de données');
    expect(visuel?.querySelector('figcaption')?.textContent).toBe(
      'Lire la donnée avant de la calculer.',
    );
  });

  it('rend le lien de source du visuel', () => {
    hote.recit = buildStoryRecit({
      id: 'R-SOURCE-05',
      visuel: {
        src: '#',
        alt: 'Tableau de données',
        legende: 'Une lecture contrôlée',
        source: 'https://example.com/photo',
      },
    });

    const lien = hote.shadowRoot?.querySelector('[data-testid="source-visuel"]');
    expect(lien?.getAttribute('href')).toBe('https://example.com/photo');
  });

  it('rend une video avec transcription, source et licence', () => {
    hote.recit = { ...RECIT, video: VIDEO };
    const video = marque(hote, 'video');
    expect(video?.querySelector('video')?.getAttribute('poster')).toBe('#');
    expect(video?.querySelector('source')?.getAttribute('src')).toBe(
      'https://example.com/rappel.webm',
    );
    expect(marque(hote, 'transcription')?.textContent).toContain('Partie divisée');
    expect(video?.querySelector('a')?.getAttribute('href')).toBe('https://example.com/source');
    expect(video?.textContent).toContain('CC BY-SA 4.0');
  });

  it('donne la grande typographie au titre pour le presentateur comme pour l etudiant', () => {
    const etudiant = hote.shadowRoot?.querySelector('.fp-root')?.innerHTML;
    expect(marque(hote, 'titre')?.classList.contains('fp-enonce')).toBe(true);
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(marque(hote, 'titre')?.classList.contains('fp-enonce')).toBe(true);
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe(
      'presentateur',
    );
    expect(hote.shadowRoot?.querySelector('.fp-root')?.innerHTML).toBe(etudiant);
  });

  it('sert la video allegee au poste etudiant et la source pleine au presentateur', () => {
    hote.recit = { ...RECIT, video: { ...VIDEO, srcPoste: 'https://example.com/poste.webm' } };
    const source = (): string | null | undefined =>
      marque(hote, 'video')?.querySelector('source')?.getAttribute('src');

    expect(source()).toBe('https://example.com/poste.webm');
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(source()).toBe(VIDEO.src);
  });

  it('n affiche plus la modalite ni la duree, quel que soit le role', () => {
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      expect(marque(hote, 'modalite')).withContext(role).toBeNull();
      expect(marque(hote, 'duree')).withContext(role).toBeNull();
    }
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildStoryRecit({ id: 'R-RECIT-06' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.recit = { ...piege, metadonnees };
    expect(JSON.stringify(hote.recit)).not.toContain('bonneReponse');
  });

  it('ne diffuse aucun evenement et n ecrit dans aucun stockage', () => {
    hote.recit = buildStoryRecit({ id: 'R-RECIT-07' });
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
    }
    expect(traces.evenements).toEqual([]);
    expect(traces.ecritures).toEqual([]);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'story')).toEqual([]);
  });
});
