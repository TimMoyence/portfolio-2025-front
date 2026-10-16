import { ROLES_DE_MONTAGE } from '../../../testing/briques-montees';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import {
  cliquerOmbre,
  creerBrique,
  detailsEmis,
  installerBrique,
  lignesDuRappel,
  noeudOmbre,
  noeudsOmbre,
} from '../../../testing/banc-de-brique';
import { buildWorkedExemple } from '../../../testing/factories/cours.factory';
import { FpWorked } from './FpWorked';

interface EnvoiWorked {
  readonly exempleId: string;
  readonly redactions: Record<string, string>;
  readonly dureeMs: number;
}

const EXEMPLE = buildWorkedExemple();
const ETAPES = EXEMPLE.etapes.map((etape) => etape.id);
const PLEIN = ETAPES.length;
const DERNIERE = ETAPES[PLEIN - 1];
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 17;

function zone(hote: FpWorked, repere: string, etape: string): HTMLTextAreaElement {
  const trouve = noeudsOmbre<HTMLElement>(hote, repere).find(
    (noeud) => noeud.dataset['etape'] === etape,
  );
  if (!(trouve instanceof HTMLTextAreaElement)) {
    throw new Error(`aucune zone ${repere} pour l etape ${etape}`);
  }
  return trouve;
}

function ecrire(hote: FpWorked, repere: string, etape: string, contenu: string): void {
  const champ = zone(hote, repere, etape);
  champ.value = contenu;
  champ.dispatchEvent(new Event('input', { bubbles: true }));
}

function aCompleter(hote: FpWorked): string[] {
  return noeudsOmbre<HTMLElement>(hote, 'etape')
    .filter((etape) => etape.dataset['resolue'] === 'false')
    .map((etape) => etape.dataset['etape'] ?? '');
}

function completerTout(hote: FpWorked): void {
  for (const etape of aCompleter(hote)) {
    ecrire(hote, 'saisie', etape, `redaction de ${etape}`);
  }
}

function montrees(hote: FpWorked): string[] {
  return noeudsOmbre<HTMLElement>(hote, 'raisonnement').map(
    (detail) => detail.dataset['etape'] ?? '',
  );
}

describe('FpWorked', () => {
  let hote: FpWorked;
  let envois: EnvoiWorked[];
  let ecouteur: (evenement: Event) => void;
  const traces = installerBrique<FpWorked>({
    balise: 'fp-worked',
    classe: FpWorked,
    poser: (brique) => {
      hote = brique;
      brique.exemple = EXEMPLE;
    },
  });

  function envoisEmis(): string[] {
    return traces.evenements.filter((nom) => nom !== 'fp-brouillon');
  }

  function dernierEnvoi(): EnvoiWorked {
    if (envois.length === 0) {
      throw new Error('aucun envoi recu');
    }
    return envois[envois.length - 1];
  }

  function monter(etayage: number): FpWorked {
    return creerBrique<FpWorked>('fp-worked', (neuf) => {
      neuf.exemple = EXEMPLE;
      neuf.etayage = etayage;
    });
  }

  beforeEach(() => {
    envois = [];
    ecouteur = (evenement: Event): void => {
      envois.push((evenement as CustomEvent).detail as EnvoiWorked);
    };
    document.addEventListener('fp-worked-submit', ecouteur);
  });

  afterEach(() => {
    document.removeEventListener('fp-worked-submit', ecouteur);
    for (const reste of [...document.querySelectorAll('fp-worked')]) {
      reste.remove();
    }
  });

  function attendreAucuneEtapePreRemplie(): void {
    expect(hote.etayage).toBe(0);
    expect(montrees(hote)).toEqual([]);
    expect(aCompleter(hote)).toEqual(ETAPES);
    expect(noeudsOmbre(hote, 'saisie').length).toBe(PLEIN);
  }

  it('imprime sur papier le raisonnement de chaque étape au corrigé, sans attendre l étayage', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.setAttribute('data-papier', '');

    expect(montrees(hote)).toEqual(ETAPES);
  });

  it('imprime sur papier les étapes de l étudiant sans bouton valider', () => {
    hote.setAttribute('data-papier', '');

    expect(noeudsOmbre(hote, 'saisie').length).toBe(PLEIN);
    expect(noeudsOmbre(hote, 'valider')).toEqual([]);
    expect(montrees(hote)).toEqual([]);
  });

  it('RET-25 · ne montre aucune correction a la premiere presentation', () => {
    attendreAucuneEtapePreRemplie();
  });

  it('RET-23 · pose sous chaque etape sa question puis un seul champ de reponse', () => {
    const etapes = noeudsOmbre(hote, 'etape');

    expect(etapes.map((etape) => etape.querySelector('label')?.textContent?.trim() ?? '')).toEqual(
      EXEMPLE.etapes.map(({ invite }) => invite),
    );
    expect(etapes.map((etape) => etape.querySelectorAll('textarea').length)).toEqual(
      ETAPES.map(() => 1),
    );
    expect(noeudsOmbre(hote, 'explication')).toEqual([]);
    expect(hote.shadowRoot?.textContent ?? '').not.toContain('À vous de rédiger');
  });

  it('RET-23 · fige la reponse de l etudiant sous laquelle s affiche la correction revelee', () => {
    ecrire(hote, 'saisie', ETAPES[0], 'ma reponse a la premiere question');
    hote.etayage = 1;
    const premiere = noeudsOmbre(hote, 'etape')[0];
    const ordre = [...premiere.querySelectorAll<HTMLElement>('[data-testid]')].map(
      (noeud) => noeud.dataset['testid'],
    );

    expect(premiere.querySelector('textarea')).toBeNull();
    expect(premiere.querySelector('[data-testid="saisie-figee"]')?.textContent?.trim()).toBe(
      'ma reponse a la premiere question',
    );
    expect(ordre).toEqual(['saisie-figee', 'correction', 'raisonnement']);
    expect(noeudsOmbre(hote, 'correction')[0]?.textContent?.trim()).toBe('Correction');
    expect(montrees(hote)).toEqual([ETAPES[0]]);
  });

  it('RET-23 · laisse un blanc fige sous une etape corrigee sans reponse', () => {
    hote.etayage = 1;
    const premiere = noeudsOmbre(hote, 'etape')[0];

    expect(premiere.querySelector('textarea')).toBeNull();
    expect(premiere.querySelector('[data-testid="saisie-figee"]')?.textContent?.trim()).toBe('');
  });

  it('RET-23 · envoie la reponse d une etape des que l etudiant quitte son champ', () => {
    ecrire(hote, 'saisie', ETAPES[0], 'reponse de la premiere etape');
    zone(hote, 'saisie', ETAPES[0]).dispatchEvent(new Event('change', { bubbles: true }));

    expect(dernierEnvoi().redactions).toEqual({ [ETAPES[0]]: 'reponse de la premiere etape' });
    expect(zone(hote, 'saisie', ETAPES[1]).disabled).toBeFalse();
  });

  it('RET-23 · n envoie rien quand toutes les etapes sont deja corrigees', () => {
    hote.etayage = PLEIN;
    cliquerOmbre(hote, 'valider');

    expect(envoisEmis()).toEqual([]);
    expect(noeudOmbre<HTMLButtonElement>(hote, 'valider')?.disabled).toBeTrue();
  });

  it('retire la derniere etape puis les deux dernieres a mesure que l etayage baisse', () => {
    hote.etayage = PLEIN - 1;
    expect(aCompleter(hote)).toEqual(ETAPES.slice(PLEIN - 1));
    expect(montrees(hote)).toEqual(ETAPES.slice(0, PLEIN - 1));
    hote.etayage = PLEIN - 2;
    expect(aCompleter(hote)).toEqual(ETAPES.slice(PLEIN - 2));
    expect(montrees(hote)).toEqual(ETAPES.slice(0, PLEIN - 2));
  });

  it('ne pre remplit aucune etape au dernier niveau d etayage', () => {
    hote.etayage = 0;
    attendreAucuneEtapePreRemplie();
  });

  it('suit l etayage pilote par le formateur, a la baisse comme a la hausse, dans les bornes', () => {
    hote.etayage = 1;
    expect(aCompleter(hote)).toEqual(ETAPES.slice(1));
    hote.etayage = PLEIN;
    expect(hote.etayage).toBe(PLEIN);
    hote.etayage = 42;
    expect(hote.etayage).toBe(PLEIN);
    hote.etayage = -3;
    expect(hote.etayage).toBe(0);
    hote.etayage = undefined;
    expect(hote.etayage).toBe(0);
  });

  it('n envoie que les reponses redigees, jamais le niveau d etayage', () => {
    hote.etayage = 1;
    completerTout(hote);
    cliquerOmbre(hote, 'valider');
    expect(
      Object.keys(dernierEnvoi()).sort((gauche, droite) => gauche.localeCompare(droite)),
    ).toEqual(['dureeMs', 'exempleId', 'redactions']);
  });

  it('emet la reponse de l etape encore sans correction', () => {
    hote.etayage = PLEIN - 1;
    ecrire(hote, 'saisie', DERNIERE, 'la valeur acquise vaut 1 124,86 euros');
    cliquerOmbre(hote, 'valider');
    expect(dernierEnvoi().redactions).toEqual({
      [DERNIERE]: 'la valeur acquise vaut 1 124,86 euros',
    });
    expect(dernierEnvoi().exempleId).toBe(EXEMPLE.id);
  });

  it('refuse d avancer tant qu une etape a completer reste vide', () => {
    hote.etayage = PLEIN - 2;
    ecrire(hote, 'saisie', DERNIERE, 'la valeur acquise');
    cliquerOmbre(hote, 'valider');
    expect(envoisEmis()).toEqual([]);
    expect(noeudsOmbre(hote, 'retour')[0]?.textContent).toContain('avant de valider');
    ecrire(hote, 'saisie', ETAPES[PLEIN - 2], 'on remplace les valeurs dans la formule');
    cliquerOmbre(hote, 'valider');
    expect(envoisEmis()).toEqual(['fp-worked-submit']);
  });

  it('confie chaque frappe au brouillon de l hote et la restaure au remontage, sans stockage', () => {
    const brouillons = detailsEmis(hote, 'fp-brouillon');
    hote.etayage = PLEIN - 1;
    ecrire(hote, 'saisie', DERNIERE, 'la valeur acquise');

    expect(brouillons.at(-1)).toEqual({
      id: EXEMPLE.id,
      valeur: { redactions: { [DERNIERE]: 'la valeur acquise' } },
    });

    const rouvert = monter(PLEIN - 1);
    rouvert.brouillon = { redactions: { [DERNIERE]: 'la valeur acquise' } };

    expect(zone(rouvert, 'saisie', DERNIERE).value).toBe('la valeur acquise');
    expect(noeudsOmbre(rouvert, 'brouillon-restaure')[0]?.textContent).toBe('Brouillon restauré');
    expect(traces.ecritures).toEqual([]);
  });

  for (const role of ROLES_DE_MONTAGE) {
    it(`ne livre au role ${role} le raisonnement d une etape qu une fois l etayage avance`, () => {
      hote.setAttribute('data-cours-role', role);
      hote.etayage = PLEIN - 1;
      const cache = EXEMPLE.etapes[PLEIN - 1].raisonnement;
      const texteAffiche = (): string => (hote.shadowRoot?.textContent ?? '').replaceAll(' ', ' ');
      expect(JSON.stringify(hote.exemple)).not.toContain(cache);
      expect(texteAffiche()).not.toContain(cache);

      hote.etayage = PLEIN;

      expect(JSON.stringify(hote.exemple)).toContain(cache);
      expect(texteAffiche()).toContain(cache);
    });
  }

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildWorkedExemple({ id: 'K-RESOLU-09' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'c' };
    hote.exemple = { ...piege, metadonnees };
    expect(JSON.stringify(hote.exemple)).not.toContain('bonneReponse');
  });

  it('echappe le html injecte dans l enonce, les etapes et les invites', () => {
    hote.exemple = buildWorkedExemple({
      id: 'K-RESOLU-08',
      enonce: CHARGE_XSS,
      etapes: EXEMPLE.etapes.map((etape) => ({
        ...etape,
        intitule: CHARGE_XSS,
        raisonnement: CHARGE_XSS,
        invite: CHARGE_XSS,
      })),
    });
    hote.etayage = PLEIN;
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(noeudsOmbre(hote, 'enonce')[0]?.textContent).toBe(CHARGE_XSS);
    expect(noeudsOmbre(hote, 'raisonnement')[0]?.textContent).toBe(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('montre au presentateur les etapes revelees sans zone de saisie ni badge de niveau', () => {
    hote.etayage = 2;
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(noeudsOmbre(hote, 'saisie')).toEqual([]);
    expect(noeudsOmbre(hote, 'explication')).toEqual([]);
    expect(noeudsOmbre(hote, 'valider')).toEqual([]);
    expect(montrees(hote)).toEqual(ETAPES.slice(0, 2));
    expect(noeudsOmbre(hote, 'niveau')).toEqual([]);
    expect(noeudsOmbre(hote, 'modalite')).toEqual([]);
    expect(noeudsOmbre(hote, 'duree')).toEqual([]);
    expect(hote.exemple?.metadonnees.dureeMinutes).toBe(8);
  });

  it('pose la meme section et le meme enonce pour les deux roles', () => {
    const cadre = (): string =>
      [...(hote.shadowRoot?.querySelectorAll('section, [data-testid="enonce"]') ?? [])]
        .map((noeud) => noeud.className)
        .join('|');
    const etudiant = cadre();
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(cadre()).toBe(etudiant);
    expect(hote.shadowRoot?.querySelector('section')?.getAttribute('data-pilote')).toBe('false');
  });

  it('RET-23 · projette au presentateur chaque question et, dessous, les seules corrections revelees', () => {
    hote.etayage = 1;
    hote.setAttribute('data-cours-role', 'presentateur');
    const etapes = noeudsOmbre(hote, 'etape');

    expect(
      etapes.map(
        (etape) => etape.querySelector('[data-testid="question"]')?.textContent?.trim() ?? '',
      ),
    ).toEqual(EXEMPLE.etapes.map(({ invite }) => invite));
    expect(montrees(hote)).toEqual([ETAPES[0]]);
    expect(
      [...etapes[0].querySelectorAll<HTMLElement>('[data-testid]')].map(
        (noeud) => noeud.dataset['testid'],
      ),
    ).toEqual(['question', 'correction', 'raisonnement']);
  });

  it('E17 · en correction, le poste étudiant suit les étapes déroulées au pupitre, sans saisie ni envoi', () => {
    hote.pilote = true;
    hote.etayage = 1;

    expect(montrees(hote)).toEqual(ETAPES.slice(0, 1));
    expect(hote.shadowRoot?.querySelectorAll('textarea').length).toBe(0);
    expect(noeudsOmbre(hote, 'valider')).toEqual([]);
    expect(noeudsOmbre(hote, 'question').length).toBe(PLEIN);
    expect(hote.shadowRoot?.querySelector('section')?.getAttribute('data-pilote')).toBe('true');

    hote.etayage = PLEIN;

    expect(montrees(hote)).toEqual(ETAPES);
    expect(envoisEmis()).toEqual([]);
  });

  it('E17 · en correction, le poste etudiant a le meme rendu que le presentateur', () => {
    hote.pilote = true;
    hote.etayage = 2;
    const etapes = (): string =>
      hote.shadowRoot?.querySelector('ol.fp-worked__etapes')?.innerHTML ?? '';
    const etudiant = etapes();

    hote.setAttribute('data-cours-role', 'presentateur');

    expect(etapes()).toBe(etudiant);
  });

  it('R-04 · rappelle au-dessus des etapes les fonctions a employer, pour chaque role et en correction, sans en echapper le contenu', () => {
    hote.exemple = buildWorkedExemple({
      rappel: [
        { libelle: 'SUPPRESPACE(texte)', valeur: 'retire les espaces en trop' },
        { libelle: CHARGE_XSS, valeur: 'CNUM(texte) convertit en nombre' },
      ],
    });
    const attendues = [
      'SUPPRESPACE(texte)',
      'retire les espaces en trop',
      CHARGE_XSS,
      'CNUM(texte) convertit en nombre',
    ];

    for (const pilote of [false, true]) {
      hote.pilote = pilote;
      for (const role of ROLES_DE_MONTAGE) {
        hote.setAttribute('data-cours-role', role);
        const rappel = noeudOmbre(hote, 'rappel');
        const contexte = `role ${role}, pilote ${String(pilote)}`;

        expect(lignesDuRappel(hote)).withContext(contexte).toEqual(attendues);
        expect(
          (rappel?.compareDocumentPosition(noeudsOmbre(hote, 'etape')[0]) ?? 0) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        )
          .withContext(contexte)
          .toBeTruthy();
        expect(hote.shadowRoot?.querySelector('img')).withContext(contexte).toBeNull();
      }
    }
    expect(hote.exemple?.rappel).toEqual([
      { libelle: 'SUPPRESPACE(texte)', valeur: 'retire les espaces en trop' },
      { libelle: CHARGE_XSS, valeur: 'CNUM(texte) convertit en nombre' },
    ]);
    expect(classesOrphelines(hote, 'worked')).toEqual([]);
  });

  it('R-04 · ne montre aucun rappel a un exemple qui n en porte pas', () => {
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      expect(noeudsOmbre(hote, 'rappel')).withContext(role).toEqual([]);
    }
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.etayage = 1;
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(CLASSES_ATTENDUES);
    expect(classesOrphelines(hote, 'worked')).toEqual([]);
  });
});
