import {
  attendreChaqueClasseCouverte,
  attendreLaCorrectionNicheeEffacee,
  attendreSansModaliteNiDuree,
  parcourirLesRolesSansEffet,
} from '../../../testing/assertions-briques';
import { ROLES_DE_MONTAGE } from '../../../testing/briques-montees';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildProCas, buildProCasAQuestionsLibres } from '../../../testing/factories/cours.factory';
import { FpPro } from './FpPro';

interface EnvoiPro {
  readonly casId: string;
  readonly reponses: Record<string, string>;
  readonly dureeMs: number;
}

const CAS = buildProCas();
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 13;
const CLASSES_AVEC_QUESTIONS = 19;

function cible(element: FpPro, repere: string): Element | null {
  return element.shadowRoot?.querySelector(`[data-testid="${repere}"]`) ?? null;
}

function lu(element: FpPro, repere: string): string {
  return cible(element, repere)?.textContent?.trim() ?? '';
}

describe('FpPro', () => {
  let hote: FpPro;
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-pro')) {
      customElements.define('fp-pro', FpPro);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-pro') as FpPro;
    traces = surveillerEffets(hote);
    hote.cas = CAS;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('pose le cas dans un aside et non dans un div nu', () => {
    const cadre = hote.shadowRoot?.querySelector('.fp-pro__cas');
    expect(cadre?.tagName).toBe('ASIDE');
    expect(lu(hote, 'metier')).toBe(CAS.metier);
    expect(lu(hote, 'situation')).toBe(CAS.situation);
  });

  it('detache le geste professionnel de la situation sous un intitule propre', () => {
    const geste = cible(hote, 'geste');
    expect(lu(hote, 'geste')).toBe(CAS.geste);
    expect(geste?.closest('.fp-pro__geste')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('.fp-pro__intitule')?.textContent?.trim()).toBe(
      'Le geste professionnel',
    );
  });

  it('R3 · ne pose ni badge métier ni encadré du geste quand l extrait les a vidés', () => {
    hote.cas = buildProCas({ id: 'M-METIER-EXTRAIT', metier: '', geste: '', consequence: null });

    expect(cible(hote, 'metier')).toBeNull();
    expect(hote.shadowRoot?.querySelector('.fp-pro__geste')).toBeNull();
    expect(lu(hote, 'situation')).toBe(CAS.situation);
  });

  it('annonce la portee du geste quand la consequence est renseignee', () => {
    expect(lu(hote, 'consequence')).toBe(`Sur le terrain : ${CAS.consequence}`);
  });

  it('n affiche aucune consequence quand elle n est pas renseignee', () => {
    hote.cas = buildProCas({ id: 'M-METIER-07', consequence: null });
    expect(cible(hote, 'consequence')).toBeNull();
    expect(hote.shadowRoot?.innerHTML ?? '').not.toContain('Sur le terrain');
  });

  it('echappe le html injecte dans le metier, la situation, le geste et la consequence', () => {
    hote.cas = buildProCas({
      id: 'M-METIER-08',
      metier: CHARGE_XSS,
      situation: CHARGE_XSS,
      geste: CHARGE_XSS,
      consequence: CHARGE_XSS,
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(lu(hote, 'metier')).toBe(CHARGE_XSS);
    expect(lu(hote, 'situation')).toBe(CHARGE_XSS);
    expect(lu(hote, 'geste')).toBe(CHARGE_XSS);
    expect(lu(hote, 'consequence')).toBe(`Sur le terrain : ${CHARGE_XSS}`);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('pose le meme dossier, avec la meme typographie du geste, pour les deux roles', () => {
    const dossier = (): string => hote.shadowRoot?.querySelector('.fp-pro__corps')?.outerHTML ?? '';
    const etudiant = dossier();
    expect(cible(hote, 'geste')?.className).toBe('fp-pro__geste-texte');

    hote.setAttribute('data-cours-role', 'presentateur');

    expect(dossier()).toBe(etudiant);
    expect(cible(hote, 'geste')?.className).toBe('fp-pro__geste-texte');
    expect(hote.shadowRoot?.querySelector('.fp-pro__cas')?.className).toBe('fp-scene fp-pro__cas');
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe(
      'presentateur',
    );
  });

  for (const role of ROLES_DE_MONTAGE) {
    it(`R4 · centre le cas metier dans sa carte pour le role ${role}`, () => {
      hote.style.display = 'block';
      hote.style.width = '1200px';
      hote.setAttribute('data-cours-role', role);
      const carte = hote.shadowRoot?.querySelector('.fp-pro__cas')?.getBoundingClientRect();
      const corps = hote.shadowRoot?.querySelector('.fp-pro__corps')?.getBoundingClientRect();
      const milieu = (boite: DOMRect | undefined): number =>
        boite === undefined ? NaN : boite.left + boite.width / 2;

      expect(Math.abs(milieu(corps) - milieu(carte))).toBeLessThanOrEqual(1);
    });
  }

  for (const role of ROLES_DE_MONTAGE) {
    it(`F04 · aligne les questions libres sur la colonne du récit pour le role ${role}`, () => {
      hote.style.display = 'block';
      hote.style.width = '1200px';
      hote.cas = buildProCasAQuestionsLibres();
      hote.setAttribute('data-cours-role', role);
      const corps = hote.shadowRoot?.querySelector('.fp-pro__corps')?.getBoundingClientRect();
      const questions = hote.shadowRoot
        ?.querySelector('.fp-pro__questions')
        ?.parentElement?.getBoundingClientRect();
      const bouton = cible(hote, 'valider')?.getBoundingClientRect();

      expect(questions?.left).toBeCloseTo(corps?.left ?? NaN, 0);
      expect(questions?.width).toBeCloseTo(corps?.width ?? NaN, 0);
      if (bouton !== undefined) {
        expect(bouton.left).toBeGreaterThanOrEqual((corps?.left ?? NaN) - 1);
      }
    });
  }

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    attendreLaCorrectionNicheeEffacee(buildProCas({ id: 'M-METIER-09' }), (contamine) => {
      hote.cas = contamine;
      return hote.cas;
    });
  });

  it('ne diffuse aucun evenement et n ecrit dans aucun stockage', () => {
    hote.cas = buildProCas({ id: 'M-METIER-10' });
    parcourirLesRolesSansEffet(hote, traces);
  });

  it('ne rend aucun badge de modalite ni de duree, pour aucun role', () => {
    attendreSansModaliteNiDuree(hote, (repere) => cible(hote, repere));
    expect(hote.cas?.metadonnees.dureeMinutes).toBe(4);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    attendreChaqueClasseCouverte(hote, 'pro', CLASSES_ATTENDUES);
  });

  it('couvre par une regle de la feuille chaque classe fp emise avec des questions libres', () => {
    hote.cas = buildProCasAQuestionsLibres();
    attendreChaqueClasseCouverte(hote, 'pro', CLASSES_AVEC_QUESTIONS);
  });

  describe('questions libres', () => {
    const MISSION = buildProCasAQuestionsLibres();
    const [MESURE, COMPARABLE] = MISSION.questionsLibres ?? [];
    let envois: EnvoiPro[];
    let ecouteur: (evenement: Event) => void;

    function champs(): HTMLTextAreaElement[] {
      return [
        ...(hote.shadowRoot?.querySelectorAll<HTMLTextAreaElement>('textarea[data-question]') ??
          []),
      ];
    }

    function ecrire(question: string, contenu: string): void {
      const champ = champs().find((zone) => zone.dataset['question'] === question);
      if (champ === undefined) {
        throw new Error(`aucun champ pour ${question}`);
      }
      champ.value = contenu;
      champ.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function valider(): void {
      hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="valider"]')?.click();
    }

    function envoisEmis(): string[] {
      return traces.evenements.filter((nom) => nom !== 'fp-brouillon');
    }

    beforeEach(() => {
      envois = [];
      ecouteur = (evenement) => envois.push((evenement as CustomEvent<EnvoiPro>).detail);
      hote.addEventListener('fp-pro-submit', ecouteur);
      hote.cas = MISSION;
      hote.setAttribute('data-cours-role', 'etudiant');
    });

    afterEach(() => {
      hote.removeEventListener('fp-pro-submit', ecouteur);
    });

    it('L3 · pose un champ de reponse sous chaque question pour l etudiant', () => {
      expect(champs().map((champ) => champ.dataset['question'])).toEqual([
        MESURE.id,
        COMPARABLE.id,
      ]);
      expect(champs()[0].placeholder).toBe(MESURE.placeholder ?? '');
      const intitules = [...(hote.shadowRoot?.querySelectorAll('label[for]') ?? [])].map((label) =>
        label.textContent?.trim(),
      );
      expect(intitules).toEqual([MESURE.question, COMPARABLE.question]);
    });

    it('L3 · envoie chaque reponse ecrite sous l identifiant de sa question', () => {
      ecrire(MESURE.id, 'Un montant de chiffre d affaires');
      ecrire(COMPARABLE.id, 'Non, la base 2024 change');
      valider();

      expect(envoisEmis()).toEqual(['fp-pro-submit']);
      expect(envois[0].casId).toBe(MISSION.id);
      expect(envois[0].reponses).toEqual({
        [MESURE.id]: 'Un montant de chiffre d affaires',
        [COMPARABLE.id]: 'Non, la base 2024 change',
      });
      expect(Number.isInteger(envois[0].dureeMs)).toBeTrue();
    });

    it('L3 · refuse d envoyer tant qu une question reste sans reponse', () => {
      ecrire(MESURE.id, 'Un montant');
      valider();

      expect(envoisEmis()).toEqual([]);
      expect(lu(hote, 'retour')).toContain('avant de valider');
    });

    it('L3 · efface le rappel de reponse manquante des que l etudiant reprend la saisie', () => {
      ecrire(MESURE.id, 'Un montant');
      valider();
      ecrire(COMPARABLE.id, 'N');

      expect(lu(hote, 'retour')).toBe('');
    });

    it('L3 · borne chaque champ a la longueur que le serveur accepte pour une reponse libre', () => {
      expect(champs().map((champ) => champ.maxLength)).toEqual([10000, 10000]);
    });

    it('L3 · verrouille les champs une fois la reponse envoyee', () => {
      ecrire(MESURE.id, 'Un montant');
      ecrire(COMPARABLE.id, 'Non');
      valider();
      valider();

      expect(envoisEmis()).toEqual(['fp-pro-submit']);
      expect(champs().every((champ) => champ.disabled)).toBeTrue();
    });

    it('L3 · confie chaque frappe au brouillon et la restaure au remontage', () => {
      const brouillons: unknown[] = [];
      hote.addEventListener('fp-brouillon', (evenement) =>
        brouillons.push((evenement as CustomEvent).detail),
      );
      ecrire(MESURE.id, 'Un montant');

      expect(brouillons.at(-1)).toEqual({
        id: MISSION.id,
        valeur: { reponses: { [MESURE.id]: 'Un montant' } },
      });

      hote.cas = null;
      hote.cas = MISSION;
      hote.brouillon = { reponses: { [MESURE.id]: 'Un montant' } };
      expect(champs()[0].value).toBe('Un montant');
      expect(traces.ecritures).toEqual([]);
    });

    it('L3 · affiche au presentateur les questions sans champ de saisie ni bouton de validation', () => {
      hote.setAttribute('data-cours-role', 'presentateur');

      expect(champs()).toEqual([]);
      expect(cible(hote, 'valider')).toBeNull();
      expect(cible(hote, 'retour')).toBeNull();
      expect(
        [...(hote.shadowRoot?.querySelectorAll('[data-testid="question-libre"]') ?? [])].map(
          (question) => question.textContent?.trim(),
        ),
      ).toEqual([MESURE.question, COMPARABLE.question]);
    });

    it('L3 · garde la meme liste de questions pour les deux roles', () => {
      const ordre = (): number =>
        hote.shadowRoot?.querySelectorAll('.fp-pro__question').length ?? 0;
      const etudiant = ordre();
      hote.setAttribute('data-cours-role', 'presentateur');
      expect(ordre()).toBe(etudiant);
      expect(hote.shadowRoot?.querySelector('ol.fp-pro__questions')).not.toBeNull();
    });

    it('L3 · echappe le html injecte dans une question libre', () => {
      hote.cas = buildProCasAQuestionsLibres({
        id: 'B2-01-A1-03-XSS',
        questionsLibres: [{ id: 'piege', question: CHARGE_XSS, placeholder: CHARGE_XSS }],
      });

      expect(hote.shadowRoot?.querySelector('img')).toBeNull();
      expect(champs()[0].placeholder).toBe(CHARGE_XSS);
    });
  });
});
