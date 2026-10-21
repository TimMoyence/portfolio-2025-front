import { detailsEmis, installerBrique, roleAffiche } from '../../../testing/banc-de-brique';
import {
  buildConcept4Definition,
  buildSortiesMachine,
  buildSortiesMachineATrenteAns,
  curseurServi,
} from '../../../testing/factories/cours.factory';
import {
  animer,
  animerJusquAuRepos,
  attendreLeParametreEchappe,
  attendreLeTroisiemeCranEmisSansArrondi,
  attendreParametresAnnonces,
  decrireLaSobrieteDUneBriqueReglable,
  emisAuPupitre,
  glisserCurseur,
  jouerAuPupitre,
  PARAMETRE_A_PAS_DECIMAL,
  relacherCurseur,
} from '../../../testing/reglages-briques';
import { sousHorlogeSimulee } from '../../../testing/horloge-simulee';
import { ecransPublicsB2_01 } from '../../../testing/fixtures/instantane-b2-01';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import type { SortiesMachine } from '../../content/types';
import { type Concept4Definition, FpConcept4 } from './FpConcept4';

const REGLAGE = 'fp-concept4-reglage';
const EVALUATION = 'fp-concept4-evaluation';
const DEFINITION = buildConcept4Definition();
const A_DIX_ANS = buildSortiesMachine();
const A_TRENTE_ANS = buildSortiesMachineATrenteAns();
const MACHINE_SERVIE = ecransPublicsB2_01().find(
  (ecran) => ecran.id === 'B2-01-A3-02-MACHINE-COEFFICIENTS',
)?.donnees?.['definition'] as Concept4Definition;
const MACHINES_SERVIES = INSTANTANES_DES_COURS_SERVIS.flatMap(([cours, instantane]) =>
  instantane.sujet.ecrans
    .filter(({ type }) => type === 'fp-concept4')
    .map((ecran) => ({
      cours,
      id: ecran.id,
      definition: ecran.donnees?.['definition'] as Concept4Definition,
    })),
);
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const ESPACE_FINE = String.fromCharCode(0x202f);
const INSECABLE = String.fromCharCode(0x00a0);
const MOINS = String.fromCharCode(0x2212);
const CLASSES_ATTENDUES = 27;

function couple(premier: string, second: string): string {
  return `${premier}${INSECABLE}% puis ${second}${INSECABLE}%`;
}

const PLUS_DIX_MOINS_DIX = couple('+10', `${MOINS}10`);
const MOINS_DIX_PLUS_DIX = couple(`${MOINS}10`, '+10');
const PLUS_VINGT_MOINS_VINGT = couple('+20', `${MOINS}20`);

function sortieEvaluee(
  valeurs: Readonly<Record<string, number>>,
  valeur: number,
  affichage: string,
): SortiesMachine {
  return buildSortiesMachine({
    valeurs,
    resultat: { valeur, affichage },
    phrase: `Un capital de 1${ESPACE_FINE}000 € placé à ${valeurs['i']} % pendant ${valeurs['n']} an(s) devient ${affichage} €.`,
  });
}

const A_VINGT_ANS = sortieEvaluee({ C: 1000, i: 4, n: 20 }, 2191.123143, `2${ESPACE_FINE}191,12`);
const A_VINGT_ANS_A_DIX_POUR_CENT = sortieEvaluee(
  { C: 1000, i: 10, n: 20 },
  6727.499949,
  `6${ESPACE_FINE}727,5`,
);

function tous(hote: FpConcept4, selecteur: string): Element[] {
  return [...(hote.shadowRoot?.querySelectorAll(selecteur) ?? [])];
}

function un(hote: FpConcept4, repere: string): Element | null {
  return hote.shadowRoot?.querySelector(`[data-testid="${repere}"]`) ?? null;
}

function lu(hote: FpConcept4, repere: string): string {
  return un(hote, repere)?.textContent?.trim() ?? '';
}

function valeurDe(hote: FpConcept4, repere: string): string {
  return un(hote, repere)?.getAttribute('data-valeur') ?? '';
}

function quatreFaces(hote: FpConcept4): Readonly<Record<string, string>> {
  return {
    formule: valeurDe(hote, 'formule'),
    graphique: valeurDe(hote, 'graphique'),
    tableau: valeurDe(hote, 'tableau'),
    phrase: valeurDe(hote, 'phrase'),
  };
}

function enAttente(hote: FpConcept4): boolean {
  return un(hote, 'faces')?.getAttribute('aria-busy') === 'true';
}

function nombreDuCurseur(hote: FpConcept4, cle: string): string {
  return tous(hote, `[data-testid="valeur"][data-cle="${cle}"]`)[0]?.textContent?.trim() ?? '';
}

function boutonsDePrereglage(hote: FpConcept4): HTMLButtonElement[] {
  return tous(hote, '[data-testid="prereglage"]') as HTMLButtonElement[];
}

function prereglage(hote: FpConcept4, libelle: string): void {
  const bouton = boutonsDePrereglage(hote).find(
    (candidat) => candidat.textContent?.trim() === libelle,
  );
  if (bouton === undefined) {
    throw new Error(`préréglage absent : ${libelle}`);
  }
  bouton.click();
}

function resultatsDuTableau(hote: FpConcept4): string[] {
  return tous(hote, '[data-testid="resultat-ligne"]').map((cellule) => cellule.textContent ?? '');
}

function avecDefaut(cle: string, defaut: number): Concept4Definition {
  return buildConcept4Definition({
    id: 'K-QUATRE-FACES-02',
    parametres: DEFINITION.parametres.map((parametre) =>
      parametre.cle === cle ? { ...parametre, defaut } : parametre,
    ),
  });
}

describe('FpConcept4', () => {
  let hote: FpConcept4;
  const traces = installerBrique<FpConcept4>({
    balise: 'fp-concept4',
    classe: FpConcept4,
    poser: (brique) => {
      hote = brique;
      brique.definition = DEFINITION;
    },
  });

  it('reflete la meme valeur servie dans les quatre faces apres une animation', () => {
    animer(hote);
    const attendue = String(A_TRENTE_ANS.resultat.valeur);
    expect(hote.valeurs['n']).toBe(30);
    expect(quatreFaces(hote)).toEqual({
      formule: attendue,
      graphique: attendue,
      tableau: attendue,
      phrase: attendue,
    });
  });

  it('surligne dans la formule le terme du parametre pilote et lui seul', () => {
    animer(hote);
    const surlignes = tous(hote, '[data-testid="terme"][data-actif="true"]');
    expect(tous(hote, '[data-testid="terme"]').length).toBe(DEFINITION.parametres.length);
    expect(surlignes.map((terme) => terme.textContent)).toEqual(['n']);
    expect(lu(hote, 'formule')).toContain('C × (1 + i)^n');
  });

  it('rend les fractions et les multiplications en notation lisible, sans exposer le LaTeX brut', () => {
    hote.definition = buildConcept4Definition({
      id: 'K-PROPORTION-FORMULE',
      parametres: [
        curseurServi({ cle: 'partie', libelle: 'partie', min: 10, max: 90, pas: 10, defaut: 30 }),
        curseurServi({ cle: 'total', libelle: 'total', min: 100, max: 900, pas: 100, defaut: 100 }),
      ],
      formuleLatexSimplifie: '\\dfrac{partie}{total} \\times 100',
      sorties: [],
    });

    const formule = lu(hote, 'formule');
    expect(formule).toContain('partie');
    expect(formule).toContain('total');
    const fraction = hote.shadowRoot?.querySelector('[data-testid="fraction"]');
    expect(fraction).not.toBeNull();
    expect(fraction?.getAttribute('aria-label')).toBe('partie divisé par total');
    expect(formule).not.toContain('\\dfrac');
    expect(formule).not.toContain('\\times');
  });

  it('montre le tableau de valeurs servi du parametre pilote et marque la seule ligne courante', () => {
    const avant = resultatsDuTableau(hote);
    animer(hote);
    const apres = resultatsDuTableau(hote);
    const courantes = tous(hote, '[data-testid="ligne"][data-courant="true"]');
    expect(avant).toEqual(A_DIX_ANS.lignes['C'].map(({ resultat }) => resultat.affichage));
    expect(apres).toEqual(A_TRENTE_ANS.lignes['n'].map(({ resultat }) => resultat.affichage));
    expect(courantes.length).toBe(1);
    expect(courantes[0]?.textContent).toContain('30');
    expect(lu(hote, 'tableau')).toContain('Duree en annees');
  });

  it('montre la phrase servie a chaque mouvement', () => {
    expect(lu(hote, 'phrase-texte')).toBe(A_DIX_ANS.phrase);

    animer(hote);

    expect(lu(hote, 'phrase-texte')).toBe(A_TRENTE_ANS.phrase);
  });

  it('L4-F11 · montre la phrase et la formule servies, et ecrit le reglage a la francaise, milliers en espace fine', () => {
    expect(lu(hote, 'phrase-texte')).toBe(
      `Un capital de 1${ESPACE_FINE}000 € placé à 4 % pendant 10 an(s) devient 1${ESPACE_FINE}480,24 €.`,
    );
    expect(lu(hote, 'resultat-formule')).toBe(`1${ESPACE_FINE}480,24`);
    expect(un(hote, 'valeur')?.textContent?.trim()).toBe(`1${ESPACE_FINE}000`);
  });

  it('dessine le graphique en svg produit par la brique sans bibliotheque, point par point servi', () => {
    const courbe = un(hote, 'courbe');
    const trace = un(hote, 'trace');
    expect(courbe).toBeInstanceOf(SVGSVGElement);
    expect(trace).toBeInstanceOf(SVGPolylineElement);
    expect((trace?.getAttribute('points') ?? '').split(' ').length).toBe(
      A_DIX_ANS.courbes['C'].length,
    );
    expect(un(hote, 'point')).toBeInstanceOf(SVGCircleElement);
    expect(tous(hote, 'img, canvas, iframe, object, script')).toEqual([]);
  });

  it('RET-21 · trace la trajectoire depart, apres t1, arrivee avec le niveau de depart en repere', () => {
    hote.definition = MACHINE_SERVIE;
    const points = (un(hote, 'trace')?.getAttribute('points') ?? '')
      .split(' ')
      .map((couple) => couple.split(',').map(Number));
    const repere = un(hote, 'repere');
    const [depart, apresUn, arrivee] = points.map(([, y]) => y);

    expect(points.length).toBe(3);
    expect(points.map(([x]) => x)).toEqual([...points.map(([x]) => x)].sort((a, b) => a - b));
    expect(Number(repere?.getAttribute('y1'))).toBe(depart);
    expect(Number(repere?.getAttribute('y2'))).toBe(depart);
    expect(apresUn).toBeLessThan(depart);
    expect(arrivee).toBeGreaterThan(depart);
  });

  it('RET-21 · liste dans le tableau chaque etape de la machine avec sa valeur servie', () => {
    hote.definition = MACHINE_SERVIE;

    expect(
      tous(hote, '[data-testid="ligne"]').map((ligne) => ligne.firstElementChild?.textContent),
    ).toEqual(['Départ', 'Après t₁', 'Arrivée']);
    expect(resultatsDuTableau(hote)).toEqual(['100', '110', '99']);
  });

  it('F20 · propose les couples de taux en un clic et marque celui qui est en place', () => {
    hote.definition = MACHINE_SERVIE;

    expect(boutonsDePrereglage(hote).map((bouton) => bouton.textContent?.trim())).toEqual([
      PLUS_DIX_MOINS_DIX,
      MOINS_DIX_PLUS_DIX,
      PLUS_VINGT_MOINS_VINGT,
    ]);
    expect(boutonsDePrereglage(hote).map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ]);

    prereglage(hote, PLUS_VINGT_MOINS_VINGT);

    expect(resultatsDuTableau(hote)).toEqual(['100', '120', '96']);
    expect(boutonsDePrereglage(hote).map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
    ]);
  });

  it('F20 · ne montre aucun prereglage sur une machine qui n en porte pas', () => {
    expect(boutonsDePrereglage(hote)).toEqual([]);
  });

  it('imprime sur papier les valeurs retenues en clair, sans bouton ni curseur', () => {
    hote.definition = MACHINE_SERVIE;
    hote.setAttribute('data-papier', '');

    expect(tous(hote, 'button, input')).toEqual([]);
    expect(
      tous(hote, '[data-testid="valeur"]').map((valeur) => valeur.textContent?.trim()),
    ).toEqual(['100', '10', '-10']);
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(
      'Valeurs retenues pour le calcul',
    );
    expect(resultatsDuTableau(hote)).toEqual(['100', '110', '99']);
  });

  it('ramene un defaut hors bornes dans les bornes au lieu de l ignorer', () => {
    hote.definition = avecDefaut('n', 99);
    expect(hote.valeurs['n']).toBe(30);
    expect(lu(hote, 'phrase-texte')).toContain('30 an(s)');
    expect(valeurDe(hote, 'formule')).toBe(String(A_TRENTE_ANS.resultat.valeur));
  });

  it('annonce chaque parametre en francais lisible et pas par un nombre nu', () => {
    attendreParametresAnnonces(hote, 'n', 'Duree en annees : 10 (de 1 à 30)');
  });

  it('echappe le html injecte dans la formule, les libelles et les sorties servies', () => {
    hote.definition = buildConcept4Definition({
      id: 'K-QUATRE-FACES-03',
      formuleLatexSimplifie: CHARGE_XSS,
      parametres: DEFINITION.parametres.map((parametre) => ({ ...parametre, libelle: CHARGE_XSS })),
      sorties: [
        buildSortiesMachine({
          resultat: { valeur: 1, affichage: CHARGE_XSS },
          phrase: CHARGE_XSS,
        }),
      ],
    });
    expect(lu(hote, 'phrase-texte')).toBe(CHARGE_XSS);
    expect(lu(hote, 'resultat-formule')).toBe(CHARGE_XSS);
    expect(lu(hote, 'formule')).toContain(CHARGE_XSS);
    attendreLeParametreEchappe(hote, 'n', CHARGE_XSS);
  });

  it('affiche le tiret servi pour un resultat absent sans casser la brique', () => {
    const ABSENT = { valeur: null, affichage: '—' };
    const sortie = buildSortiesMachine({
      resultat: ABSENT,
      courbes: { C: [{ x: 100, y: null }], i: [], n: [] },
      lignes: { C: A_DIX_ANS.lignes['C'].map((ligne) => ({ ...ligne, resultat: ABSENT })) },
      phrase: 'Un capital de 1 000 € devient — €.',
    });
    hote.definition = buildConcept4Definition({ id: 'K-QUATRE-FACES-05', sorties: [sortie] });

    expect(lu(hote, 'resultat-formule')).toBe('—');
    expect(resultatsDuTableau(hote).every((resultat) => resultat === '—')).toBe(true);
    expect(lu(hote, 'phrase-texte')).toContain('— €.');
    expect(un(hote, 'courbe')).toBeInstanceOf(SVGSVGElement);
    expect(un(hote, 'trace')?.getAttribute('points')).toBe('');
  });

  it('rend la meme machine pour l etudiant et le presentateur, seul le role de la racine change', () => {
    const structure = (): Readonly<Record<string, number>> => ({
      faces: tous(hote, '.fp-concept4__face').length,
      curseurs: tous(hote, '[data-testid="curseur"]').length,
      animer: tous(hote, '[data-testid="animer"]').length,
      lignes: tous(hote, '[data-testid="ligne"]').length,
    });
    const etudiant = structure();
    const phraseEtudiant = lu(hote, 'phrase-texte');
    expect(roleAffiche(hote)).toBe('etudiant');

    hote.setAttribute('data-cours-role', 'presentateur');

    expect(structure()).toEqual(etudiant);
    expect(etudiant).toEqual({
      faces: 4,
      curseurs: DEFINITION.parametres.length,
      animer: 1,
      lignes: jasmine.any(Number),
    });
    expect(lu(hote, 'phrase-texte')).toBe(phraseEtudiant);
    expect(un(hote, 'phrase-texte')?.classList.contains('fp-prose')).toBe(true);
    expect(roleAffiche(hote)).toBe('presentateur');
  });

  it('RET-21 · laisse le formateur manipuler la machine en projection', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    relacherCurseur(hote, 'n', '30');

    expect(hote.valeurs['n']).toBe(30);
    expect(valeurDe(hote, 'formule')).toBe(String(A_TRENTE_ANS.resultat.valeur));
    expect(tous(hote, '[data-testid="animer"]').length).toBe(1);
  });

  describe('F-37 · la machine montre les sorties servies par le back et n evalue rien', () => {
    function montreSansRienDemander(sortie: SortiesMachine, ...positions: string[]): void {
      const evaluations = detailsEmis(hote, EVALUATION);
      for (const position of positions) {
        relacherCurseur(hote, 'n', position);
      }
      expect(evaluations).toEqual([]);
      expect(lu(hote, 'resultat-formule')).toBe(sortie.resultat.affichage);
    }

    it('montre aux quatre faces la sortie servie pour les reglages en place, sans rien calculer', () => {
      const temoin = buildSortiesMachine({
        resultat: { valeur: 4321, affichage: `4${ESPACE_FINE}321` },
        phrase: 'Phrase servie par le back.',
      });
      hote.definition = buildConcept4Definition({ sorties: [temoin] });

      expect(lu(hote, 'resultat-formule')).toBe(`4${ESPACE_FINE}321`);
      expect(lu(hote, 'phrase-texte')).toBe('Phrase servie par le back.');
      expect(quatreFaces(hote)).toEqual({
        formule: '4321',
        graphique: '4321',
        tableau: '4321',
        phrase: '4321',
      });
      expect(enAttente(hote)).toBe(false);
    });

    it('pendant le glisser, seul le nombre du curseur bouge', () => {
      const evaluations = detailsEmis(hote, EVALUATION);
      const tableauAvant = resultatsDuTableau(hote);

      glisserCurseur(hote, 'n', '30');

      expect(nombreDuCurseur(hote, 'n')).toBe('30');
      expect(lu(hote, 'resultat-formule')).toBe(A_DIX_ANS.resultat.affichage);
      expect(lu(hote, 'phrase-texte')).toBe(A_DIX_ANS.phrase);
      expect(resultatsDuTableau(hote)).toEqual(tableauAvant);
      expect(enAttente(hote)).toBe(true);
      expect(evaluations).toEqual([]);
    });

    it('au relachement sur une position servie, montre sa sortie sans rien demander au back', () => {
      const evaluations = detailsEmis(hote, EVALUATION);

      relacherCurseur(hote, 'n', '30');

      expect(evaluations).toEqual([]);
      expect(lu(hote, 'resultat-formule')).toBe(A_TRENTE_ANS.resultat.affichage);
      expect(lu(hote, 'phrase-texte')).toBe(A_TRENTE_ANS.phrase);
      expect(enAttente(hote)).toBe(false);
    });

    it('au relachement sur une position non servie, demande son evaluation et garde la sortie montree, en attente', () => {
      const evaluations = detailsEmis(hote, EVALUATION);

      relacherCurseur(hote, 'n', '20');

      expect(evaluations).toEqual([{ reglages: { C: 1000, i: 4, n: 20 } }]);
      expect(lu(hote, 'resultat-formule')).toBe(A_DIX_ANS.resultat.affichage);
      expect(enAttente(hote)).toBe(true);
    });

    it('montre la sortie evaluee qui repond aux reglages en place, puis la reprend sans la redemander', () => {
      relacherCurseur(hote, 'n', '20');

      hote.evaluee = A_VINGT_ANS;

      expect(lu(hote, 'resultat-formule')).toBe(A_VINGT_ANS.resultat.affichage);
      expect(lu(hote, 'phrase-texte')).toBe(A_VINGT_ANS.phrase);
      expect(enAttente(hote)).toBe(false);
      montreSansRienDemander(A_VINGT_ANS, '10', '20');
    });

    it('garde en reserve une sortie evaluee qui ne repond plus aux reglages en place', () => {
      relacherCurseur(hote, 'n', '20');
      relacherCurseur(hote, 'n', '25');

      hote.evaluee = A_VINGT_ANS;

      expect(lu(hote, 'resultat-formule')).toBe(A_DIX_ANS.resultat.affichage);
      expect(enAttente(hote)).toBe(true);
      montreSansRienDemander(A_VINGT_ANS, '20');
    });

    it('au pupitre, ne demande aucune evaluation : il montre les sorties projetees par la seance', () => {
      const evaluations = emisAuPupitre(hote, EVALUATION, () => relacherCurseur(hote, 'n', '20'));

      expect(evaluations).toEqual([]);
      expect(enAttente(hote)).toBe(true);

      hote.evaluee = A_VINGT_ANS;

      expect(lu(hote, 'resultat-formule')).toBe(A_VINGT_ANS.resultat.affichage);
    });

    it('annonce le refus d une evaluation sous les faces', () => {
      relacherCurseur(hote, 'n', '20');

      hote.erreur = 'Calcul non reçu';

      expect(lu(hote, 'erreur')).toBe('Calcul non reçu');
      expect(un(hote, 'erreur')?.getAttribute('role')).toBe('alert');
      expect(nombreDuCurseur(hote, 'n')).toBe('20');
    });

    it('en apercu, ne demande aucune evaluation', () => {
      hote.setAttribute('data-apercu', '');
      const evaluations = detailsEmis(hote, EVALUATION);

      relacherCurseur(hote, 'n', '20');

      expect(evaluations).toEqual([]);
    });

    describe('animation sans suite servie', () => {
      sousHorlogeSimulee(() => {
        hote.definition = buildConcept4Definition({ animation: undefined });
      });

      it('demande au back l evaluation de chaque etat joue', () => {
        const evaluations = detailsEmis(hote, EVALUATION);
        const joues: Readonly<Record<string, number>>[] = [];

        animerJusquAuRepos(hote, () => joues.push(hote.valeurs));

        expect(joues.length).toBeGreaterThan(1);
        expect(joues.at(-1)).toEqual({ C: 5000, i: 10, n: 30 });
        expect(evaluations).toEqual(joues.map((reglages) => ({ reglages })));
      });
    });
  });

  describe('F-37 · chaque reglage atteignable d une machine servie trouve sa sortie servie', () => {
    sousHorlogeSimulee();

    function attendreLaSortieServie(
      definition: Concept4Definition,
      evaluations: unknown[],
      contexte: string,
    ): void {
      const servie = definition.sorties.find((sortie) =>
        definition.parametres.every(({ cle }) => sortie.valeurs[cle] === hote.valeurs[cle]),
      );
      const detail = `${contexte} ${JSON.stringify(hote.valeurs)}`;
      expect(servie).withContext(detail).toBeDefined();
      expect(enAttente(hote)).withContext(detail).toBe(false);
      expect(lu(hote, 'resultat-formule'))
        .withContext(detail)
        .toBe(servie?.resultat.affichage ?? '');
      expect(evaluations).withContext(detail).toEqual([]);
    }

    it('trouve des machines servies dans les cours', () => {
      expect(MACHINES_SERVIES.length).toBeGreaterThan(0);
    });

    for (const { cours, id, definition } of MACHINES_SERVIES) {
      it(`${cours} ${id} · au defaut, a chaque prereglage et a chaque etat anime`, () => {
        hote.definition = definition;
        const evaluations = detailsEmis(hote, EVALUATION);
        attendreLaSortieServie(definition, evaluations, 'defaut');
        for (let rang = 0; rang < boutonsDePrereglage(hote).length; rang += 1) {
          boutonsDePrereglage(hote)[rang]?.click();
          attendreLaSortieServie(definition, evaluations, `prereglage ${rang}`);
        }
        animerJusquAuRepos(hote, () =>
          attendreLaSortieServie(definition, evaluations, 'animation'),
        );
      });
    }
  });

  describe('synchronisation du pupitre vers la projection', () => {
    function reglerN(valeur: string): void {
      relacherCurseur(hote, 'n', valeur);
    }

    it('RET-21 · au pupitre, emet les reglages une fois le curseur relache', () => {
      const emis = emisAuPupitre(hote, REGLAGE, () => reglerN('20'));

      expect(emis).toEqual([{ reglages: { C: 1000, i: 4, n: 20 } }]);
    });

    it('G2 · au pupitre, emet le cran écrit par un curseur à pas décimal, sans erreur d arrondi', () => {
      hote.definition = buildConcept4Definition({ parametres: [PARAMETRE_A_PAS_DECIMAL] });

      attendreLeTroisiemeCranEmisSansArrondi(hote, REGLAGE);
    });

    const REGLAGES_SANS_EMISSION: readonly { titre: string; regler: () => unknown[] }[] = [
      {
        titre: 'RET-21 · au pupitre, n emet rien tant que le curseur glisse sans etre relache',
        regler: () => emisAuPupitre(hote, REGLAGE, () => glisserCurseur(hote, 'n', '20')),
      },
      {
        titre: 'RET-21 · en apercu, le pupitre n emet aucun reglage vers la seance',
        regler: () => {
          hote.setAttribute('data-apercu', '');
          return emisAuPupitre(hote, REGLAGE, () => reglerN('20'));
        },
      },
      {
        titre: 'RET-21 · chez l etudiant, la machine reste une exploration personnelle',
        regler: () => {
          const emis = detailsEmis(hote, REGLAGE);
          reglerN('20');
          return emis;
        },
      },
    ];

    for (const cas of REGLAGES_SANS_EMISSION) {
      it(cas.titre, () => {
        const emis = cas.regler();

        expect(emis).toEqual([]);
        expect(hote.valeurs['n']).toBe(20);
      });
    }

    it('F20 · au pupitre, emet les reglages au clic d un prereglage', () => {
      hote.definition = MACHINE_SERVIE;
      const emis = emisAuPupitre(hote, REGLAGE, () => prereglage(hote, PLUS_VINGT_MOINS_VINGT));

      expect(emis).toEqual([{ reglages: { depart: 100, tauxUn: 20, tauxDeux: -20 } }]);
    });

    it('F20 · chez l etudiant, un prereglage regle la machine sans rien emettre', () => {
      hote.definition = MACHINE_SERVIE;
      const emis = detailsEmis(hote, REGLAGE);
      const evaluations = detailsEmis(hote, EVALUATION);

      prereglage(hote, MOINS_DIX_PLUS_DIX);

      expect(emis).toEqual([]);
      expect(evaluations).toEqual([]);
      expect(hote.valeurs).toEqual({ depart: 100, tauxUn: -10, tauxDeux: 10 });
    });

    it('RET-21 · la projection suit les reglages pilotes, bornes a la machine, et montre leur sortie projetee', () => {
      hote.setAttribute('data-cours-role', 'presentateur');

      hote.reglages = { n: 20, i: 99 };

      expect(hote.valeurs).toEqual({ C: 1000, i: 10, n: 20 });
      expect(enAttente(hote)).toBe(true);

      hote.evaluee = A_VINGT_ANS_A_DIX_POUR_CENT;

      expect(valeurDe(hote, 'formule')).toBe(String(A_VINGT_ANS_A_DIX_POUR_CENT.resultat.valeur));
      expect(enAttente(hote)).toBe(false);
    });

    describe('R8 · animation de la machine à coefficients', () => {
      sousHorlogeSimulee(() => {
        hote.definition = MACHINE_SERVIE;
      });

      it('change une seule valeur toutes les trois secondes, de +50 % à −50 %', () => {
        animer(hote);
        expect(hote.valeurs).toEqual({ depart: 100, tauxUn: 0, tauxDeux: 0 });

        jasmine.clock().tick(2999);
        expect(hote.valeurs).toEqual({ depart: 100, tauxUn: 0, tauxDeux: 0 });

        jasmine.clock().tick(1);
        expect(hote.valeurs).toEqual({ depart: 100, tauxUn: 50, tauxDeux: 0 });

        jasmine.clock().tick(3000);
        expect(hote.valeurs).toEqual({ depart: 100, tauxUn: 50, tauxDeux: -50 });
        expect(valeurDe(hote, 'phrase')).toBe('75');
      });

      it('relaie au pupitre chaque état joué', () => {
        expect(jouerAuPupitre(hote, REGLAGE)).toEqual([
          { reglages: { depart: 100, tauxUn: 0, tauxDeux: 0 } },
          { reglages: { depart: 100, tauxUn: 50, tauxDeux: 0 } },
          { reglages: { depart: 100, tauxUn: 50, tauxDeux: -50 } },
        ]);
      });

      it('s arrête dès qu un préréglage est choisi', () => {
        animer(hote);
        prereglage(hote, PLUS_DIX_MOINS_DIX);
        jasmine.clock().tick(6000);

        expect(hote.valeurs).toEqual({ depart: 100, tauxUn: 10, tauxDeux: -10 });
      });
    });
  });

  decrireLaSobrieteDUneBriqueReglable({
    hote: () => hote,
    traces,
    piege: buildConcept4Definition({ id: 'K-QUATRE-FACES-04' }),
    brique: 'concept4',
    classes: CLASSES_ATTENDUES,
  });
});
