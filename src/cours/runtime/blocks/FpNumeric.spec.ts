import {
  buildNumericQuestion,
  buildVerdictDeReponse,
} from '../../../testing/factories/cours.factory';
import { attendreUneRegionLive } from '../../../testing/assertions-briques';
import { ROLES_DE_MONTAGE } from '../../../testing/briques-montees';
import {
  cliquerOmbre,
  detailsEmis,
  installerBrique,
  noeudOmbre,
  texteOmbre,
} from '../../../testing/banc-de-brique';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { figerLesHorloges, reculerLaPendule, UNE_HEURE_MS } from '../../../testing/horloge-simulee';
import { FpNumeric, type NumericQuestionPublique } from './FpNumeric';

type ClesIdentiques<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const SURFACE_PUBLIQUE_EXACTE: ClesIdentiques<
  keyof NumericQuestionPublique,
  'id' | 'enonce' | 'unite' | 'metadonnees'
> = true;

interface DetailNumeric {
  questionId: string;
  valeur: string;
  dureeMs: number;
}

const QUESTION_NOTEE = buildNumericQuestion();
const CLES_PUBLIQUES = ['enonce', 'id', 'metadonnees', 'unite'];
const VALEUR_ATTENDUE = '1480.24';
const SAISIE_VALIDE = '12,5';
const MESSAGE_REFUS = 'Saisissez un nombre — la virgule décimale est acceptée';
const INSTANT_INITIAL = '2026-09-12T08:00:00.000Z';
const DELAI_SAISIE_MS = 300;
const AUTRE_QUESTION = 'Q-TAUX-02';
const CORRIGE = { type: 'cible', cible: VALEUR_ATTENDUE };

function champDe(element: FpNumeric): HTMLInputElement | null {
  return noeudOmbre<HTMLInputElement>(element, 'champ');
}

function saisir(element: FpNumeric, frappe: string): void {
  const champ = champDe(element);
  if (champ !== null) {
    champ.value = frappe;
  }
  cliquerOmbre(element, 'valider');
}

function clesDe(element: FpNumeric): string[] {
  return Object.keys(element.question ?? {}).sort((gauche, droite) => gauche.localeCompare(droite));
}

function soumissionsDe(element: FpNumeric): DetailNumeric[] {
  return detailsEmis(element, 'fp-numeric-submit');
}

function dureeEmise(lectureMs: number, rafraichissements: number, reculMs = 0): number | undefined {
  figerLesHorloges(INSTANT_INITIAL);
  try {
    const element = document.createElement('fp-numeric') as FpNumeric;
    element.question = QUESTION_NOTEE;
    document.body.appendChild(element);
    const details = soumissionsDe(element);
    jasmine.clock().tick(lectureMs);
    reculerLaPendule(reculMs);
    for (let rang = 0; rang < rafraichissements; rang += 1) {
      element.setAttribute('etat', `rendu-${rang}`);
    }
    jasmine.clock().tick(DELAI_SAISIE_MS);
    saisir(element, '12');
    element.remove();
    return details[0]?.dureeMs;
  } finally {
    jasmine.clock().uninstall();
  }
}

describe('FpNumeric', () => {
  let hote: FpNumeric;

  installerBrique<FpNumeric>({
    balise: 'fp-numeric',
    classe: FpNumeric,
    poser: (brique) => {
      hote = brique;
      brique.question = QUESTION_NOTEE;
    },
  });

  it('affiche l enonce de la question', () => {
    const legende = hote.shadowRoot?.querySelector('legend');
    expect(legende?.textContent?.trim()).toBe(QUESTION_NOTEE.enonce);
  });

  it('ouvre le clavier decimal sans rejeter la virgule', () => {
    const champ = champDe(hote);
    expect(champ?.getAttribute('inputmode')).toBe('decimal');
    expect(champ?.getAttribute('type')).toBe('text');
  });

  it('rend l unite hors du champ et la rattache a la saisie', () => {
    const unite = noeudOmbre(hote, 'unite');
    expect(unite?.tagName).toBe('SPAN');
    expect(unite?.textContent?.trim()).toBe('€');
    expect(champDe(hote)?.value).toBe('');
    expect(champDe(hote)?.getAttribute('aria-describedby')).toBe(unite?.id ?? '');
  });

  it('n annonce aucune unite quand la question n en porte pas', () => {
    hote.question = buildNumericQuestion({ id: AUTRE_QUESTION, unite: null });
    expect(noeudOmbre(hote, 'unite')).toBeNull();
    expect(champDe(hote)?.getAttribute('aria-describedby')).toBeNull();
  });

  for (const frappe of ['1 480,24', 'douze']) {
    it(`emet la saisie brute « ${frappe} », que le serveur lit`, () => {
      const details = soumissionsDe(hote);
      saisir(hote, frappe);
      expect(details).toEqual([
        jasmine.objectContaining({ questionId: QUESTION_NOTEE.id, valeur: frappe }),
      ]);
    });
  }

  it('garde la saisie refusee par le serveur dans le champ rouvert', () => {
    saisir(hote, 'douze');
    hote.erreur = MESSAGE_REFUS;

    expect(champDe(hote)?.value).toBe('douze');
    expect(champDe(hote)?.disabled).toBe(false);
  });

  it('verrouille le champ apres une reponse acceptee', () => {
    saisir(hote, SAISIE_VALIDE);
    expect(champDe(hote)?.disabled).toBe(true);
    expect(texteOmbre(hote, 'retour')).toBe('Réponse enregistrée');
  });

  it('valide la saisie à la touche Entrée, comme le bouton', () => {
    const details = soumissionsDe(hote);
    const champ = champDe(hote);
    if (champ === null) {
      throw new Error('champ absent');
    }
    champ.value = SAISIE_VALIDE;
    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(details.length).toBe(0);

    champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(details.map((detail) => detail.valeur)).toEqual([SAISIE_VALIDE]);
    expect(champDe(hote)?.disabled).toBe(true);
  });

  it('n emet qu une seule reponse par question', () => {
    const details = soumissionsDe(hote);
    saisir(hote, SAISIE_VALIDE);
    saisir(hote, '99');
    expect(details.length).toBe(1);
  });

  it('deverrouille le champ quand une nouvelle question arrive', () => {
    saisir(hote, SAISIE_VALIDE);
    hote.question = buildNumericQuestion({ id: AUTRE_QUESTION });
    expect(champDe(hote)?.disabled).toBe(false);
    expect(champDe(hote)?.value).toBe('');
    expect(texteOmbre(hote, 'retour')).toBe('');
  });

  const CAS_DUREE: ReadonlyArray<{
    nom: string;
    lecture: number;
    rendus: number;
    recul?: number;
    attendu: number;
  }> = [
    { nom: 'une reponse immediate', lecture: 0, rendus: 0, attendu: DELAI_SAISIE_MS },
    { nom: 'une longue reflexion', lecture: 40000, rendus: 0, attendu: 40300 },
    {
      nom: 'une longue reflexion coupee par deux rendus',
      lecture: 40000,
      rendus: 2,
      attendu: 40300,
    },
    {
      nom: 'une reponse dont l horloge du poste recule d une heure pendant la lecture',
      lecture: 4000,
      rendus: 0,
      recul: UNE_HEURE_MS,
      attendu: 4000 + DELAI_SAISIE_MS,
    },
  ];

  for (const cas of CAS_DUREE) {
    it(`mesure ${cas.nom} depuis la presentation de la question`, () => {
      expect(dureeEmise(cas.lecture, cas.rendus, cas.recul)).toBe(cas.attendu);
    });
  }

  it('declare une surface publique exactement egale aux quatre champs annonces', () => {
    expect([SURFACE_PUBLIQUE_EXACTE, clesDe(hote)]).toEqual([true, CLES_PUBLIQUES]);
  });

  it('efface la tolerance et la valeur attendue pour le poste etudiant', () => {
    expect(clesDe(hote)).toEqual(CLES_PUBLIQUES);
    const recu = JSON.stringify(hote.question);
    expect(recu).not.toContain('tolerance');
    expect(recu).not.toContain(VALEUR_ATTENDUE);
  });

  it('efface la tolerance et la valeur attendue meme pour le poste presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.question = buildNumericQuestion({ id: 'Q-PRES-01' });
    expect(clesDe(hote)).toEqual(CLES_PUBLIQUES);
    expect(JSON.stringify(hote.question)).not.toContain(VALEUR_ATTENDUE);
  });

  it('efface une valeur attendue nichee dans les metadonnees', () => {
    const piege = buildNumericQuestion({ id: 'Q-PIEGE-01' });
    const metadonnees = { ...piege.metadonnees, valeurAttendue: 1480.24 };
    hote.question = { ...piege, metadonnees };
    expect(JSON.stringify(hote.question)).not.toContain(VALEUR_ATTENDUE);
  });

  it('ne publie dans le DOM aucune valeur attendue tant qu aucun corrige n est pose', () => {
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      expect(hote.shadowRoot?.innerHTML).withContext(role).not.toContain(VALEUR_ATTENDUE);
      expect(noeudOmbre(hote, 'bonne-reponse')).withContext(role).toBeNull();
    }
  });

  it('D-07 · revele au presentateur comme a l etudiant la cible telle que le back la sert, sans la reecrire', () => {
    hote.corrige = CORRIGE;
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      const bonneReponse = noeudOmbre(hote, 'bonne-reponse');
      expect(bonneReponse?.textContent).withContext(role).toContain(VALEUR_ATTENDUE);
      expect(bonneReponse?.getAttribute('data-etat')).withContext(role).toBe('confirme');
    }
  });

  it('ignore un corrige qui n est pas une cible', () => {
    hote.corrige = { type: 'option', option: 'A' };
    expect(noeudOmbre(hote, 'bonne-reponse')).toBeNull();
  });

  it('marque la saisie juste ou fausse quand corrige et verdict sont reinjectes', () => {
    hote.corrige = CORRIGE;
    expect(champDe(hote)?.hasAttribute('data-correction')).toBeFalse();

    hote.verdict = buildVerdictDeReponse({ questionId: QUESTION_NOTEE.id });
    expect(champDe(hote)?.getAttribute('data-correction')).toBe('fausse');

    hote.verdict = buildVerdictDeReponse({ questionId: QUESTION_NOTEE.id, correcte: true });
    expect(champDe(hote)?.getAttribute('data-correction')).toBe('juste');
  });

  it('montre le meme enonce au presentateur, sans champ ni bouton de saisie', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(
      QUESTION_NOTEE.enonce,
    );
    expect(champDe(hote)).toBeNull();
    expect(noeudOmbre(hote, 'valider')).toBeNull();
    expect(noeudOmbre(hote, 'retour')).toBeNull();
  });

  it('laisse l enonce seul dans sa carte au presentateur tant que rien n est revele, sans corps vide sous la legende', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    const enfants = () =>
      [...(hote.shadowRoot?.querySelector('fieldset')?.children ?? [])].map((enfant) =>
        enfant.tagName.toLowerCase(),
      );

    expect(enfants()).toEqual(['legend']);
    expect(getComputedStyle(hote.shadowRoot?.querySelector('legend') as Element).marginBottom).toBe(
      '0px',
    );

    hote.corrige = CORRIGE;

    expect(enfants()).toEqual(['legend', 'div']);
  });

  for (const { largeur, uniteALaLigne } of [
    { largeur: '260px', uniteALaLigne: true },
    { largeur: '600px', uniteALaLigne: false },
  ]) {
    it(`garde le champ et son unite dans une carte de ${largeur}, l unite ne passant a la ligne que faute de place`, () => {
      hote.style.display = 'block';
      hote.style.width = largeur;
      hote.question = buildNumericQuestion({ unite: 'jours' });
      const fieldset = hote.shadowRoot?.querySelector('fieldset') as HTMLElement;
      const style = getComputedStyle(fieldset);
      const bordInterieur =
        fieldset.getBoundingClientRect().right -
        parseFloat(style.borderRightWidth) -
        parseFloat(style.paddingRight);
      const champ = champDe(hote)?.getBoundingClientRect();
      const unite = noeudOmbre(hote, 'unite')?.getBoundingClientRect();

      expect(champ?.right).toBeLessThanOrEqual(bordInterieur + 0.5);
      expect(unite?.right).toBeLessThanOrEqual(bordInterieur + 0.5);
      expect((unite?.top ?? NaN) >= (champ?.bottom ?? NaN)).toBe(uniteALaLigne);
    });
  }

  it('attend la question sous le meme libelle pour les deux roles', () => {
    for (const role of ROLES_DE_MONTAGE) {
      const vide = document.createElement('fp-numeric') as FpNumeric;
      vide.setAttribute('data-cours-role', role);
      document.body.appendChild(vide);
      expect(texteOmbre(vide, 'attente')).withContext(role).toBe(vide.texte('chargement'));
      vide.remove();
    }
  });

  it('echappe le html injecte dans l enonce et dans l unite', () => {
    const charge = '<img src=x onerror="alert(1)">';
    hote.question = buildNumericQuestion({ id: 'Q-XSS-01', enonce: charge, unite: charge });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(charge);
  });

  it('annonce le retour dans une region live', () => {
    attendreUneRegionLive(hote);
  });

  it('ne recapitule plus la modalite ni la duree prevue, quel que soit le role', () => {
    for (const role of ROLES_DE_MONTAGE) {
      hote.setAttribute('data-cours-role', role);
      expect(noeudOmbre(hote, 'modalite')).withContext(role).toBeNull();
      expect(noeudOmbre(hote, 'duree')).withContext(role).toBeNull();
    }
    expect(hote.question?.metadonnees.modalite).toBe(QUESTION_NOTEE.metadonnees.modalite);
  });

  it('affiche le verdict reinjecte de sa question, jamais celui d une autre', () => {
    hote.verdict = buildVerdictDeReponse({ questionId: AUTRE_QUESTION });
    expect(noeudOmbre(hote, 'verdict')).toBeNull();

    hote.verdict = buildVerdictDeReponse({ questionId: QUESTION_NOTEE.id });
    const verdict = noeudOmbre(hote, 'verdict');

    expect(verdict?.getAttribute('data-etat')).toBe('a-revoir');
    expect(verdict?.textContent).toContain('À revoir');
    expect(verdict?.textContent).toContain('Intérêts simples au lieu de composés');
    expect(champDe(hote)?.disabled).withContext('un verdict recu clot la question').toBeTrue();
  });

  it('montre le deja repondu et verrouille la saisie', () => {
    hote.dejaRepondu = true;
    expect(noeudOmbre(hote, 'deja-repondu')).not.toBeNull();
    expect(champDe(hote)?.disabled).toBeTrue();
  });

  it('rouvre la saisie quand l hote signale un refus, en l affichant', () => {
    saisir(hote, SAISIE_VALIDE);
    hote.erreur = 'Cet écran n’est pas encore ouvert';

    expect(champDe(hote)?.disabled).toBeFalse();
    expect(noeudOmbre(hote, 'erreur')?.textContent).toContain('pas encore ouvert');
  });

  it('en apercu, annonce que les reponses partent en seance et laisse reessayer', () => {
    hote.setAttribute('data-apercu', '');
    saisir(hote, SAISIE_VALIDE);

    expect(texteOmbre(hote, 'retour')).toBe('Aperçu : les réponses s’envoient pendant la séance');
    expect(champDe(hote)?.disabled).toBeFalse();
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    hote.corrige = CORRIGE;
    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(10);
    expect(classesOrphelines(hote, 'numeric')).toEqual([]);
  });
});
