import {
  attendreAucunEffet,
  attendreChaqueClasseCouverte,
  attendreLaCorrectionNicheeEffacee,
} from '../../../testing/assertions-briques';
import { type TracesEffets, surveillerEffets } from '../../../testing/effets-briques';
import { buildConcept4Definition } from '../../../testing/factories/cours.factory';
import { evaluerExpression, remplirGabarit } from '../core/formula';
import { type Concept4Definition, FpConcept4 } from './FpConcept4';

const DEFINITION = buildConcept4Definition();
const MACHINE = buildConcept4Definition({
  id: 'K-MACHINE-COEFFICIENTS',
  parametres: [
    { cle: 'depart', libelle: 'Valeur de départ (€)', min: 1, max: 200, pas: 1, defaut: 100 },
    { cle: 'tauxUn', libelle: 'Premier taux (%)', min: -50, max: 50, pas: 1, defaut: 10 },
    { cle: 'tauxDeux', libelle: 'Second taux (%)', min: -50, max: 50, pas: 1, defaut: -10 },
  ],
  formuleLatexSimplifie: 'arrivée = départ × (1 + t₁) × (1 + t₂)',
  calcul: 'depart * (1 + tauxUn / 100) * (1 + tauxDeux / 100)',
  phrase: 'De {depart} € on arrive à {resultat} €.',
  etapes: [
    { libelle: 'Départ', calcul: 'depart' },
    { libelle: 'Après t₁', calcul: 'depart * (1 + tauxUn / 100)' },
    { libelle: 'Arrivée', calcul: 'depart * (1 + tauxUn / 100) * (1 + tauxDeux / 100)' },
  ],
  prereglages: [
    { libelle: '+10 % puis −10 %', valeurs: { tauxUn: 10, tauxDeux: -10 } },
    { libelle: '−10 % puis +10 %', valeurs: { tauxUn: -10, tauxDeux: 10 } },
    { libelle: '+20 % puis −20 %', valeurs: { tauxUn: 20, tauxDeux: -20 } },
  ],
});
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CLASSES_ATTENDUES = 27;
const POINTS_ATTENDUS = 25;

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

function animer(hote: FpConcept4): void {
  const bouton = hote.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="animer"]');
  if (bouton === null || bouton === undefined) {
    throw new Error('aucun bouton d animation');
  }
  bouton.click();
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

function formaterEsperee(valeur: number): string {
  return Number.isFinite(valeur) ? String(Math.round(valeur * 100) / 100).replace('.', ',') : '—';
}

function resultatAttendu(valeurs: Readonly<Record<string, number>>): number {
  return evaluerExpression(DEFINITION.calcul, valeurs).valeur ?? Number.NaN;
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
  let traces: TracesEffets;

  beforeAll(() => {
    if (!customElements.get('fp-concept4')) {
      customElements.define('fp-concept4', FpConcept4);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-concept4') as FpConcept4;
    traces = surveillerEffets(hote);
    hote.definition = DEFINITION;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    traces.restaurer();
    hote.remove();
  });

  it('reflete la meme valeur dans les quatre faces apres une animation', () => {
    animer(hote);
    const attendue = String(resultatAttendu(hote.valeurs));
    expect(hote.valeurs['n']).toBeGreaterThan(10);
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
        { cle: 'partie', libelle: 'partie', min: 10, max: 90, pas: 10, defaut: 30 },
        { cle: 'total', libelle: 'total', min: 100, max: 900, pas: 100, defaut: 100 },
      ],
      formuleLatexSimplifie: '\\dfrac{partie}{total} \\times 100',
      calcul: '(partie/total)*100',
      phrase: '{partie} représente {resultat} % de {total}.',
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

  it('recalcule le tableau de valeurs et marque la seule ligne courante', () => {
    const avant = resultatsDuTableau(hote);
    animer(hote);
    const apres = resultatsDuTableau(hote);
    const courantes = tous(hote, '[data-testid="ligne"][data-courant="true"]');
    expect(apres).not.toEqual(avant);
    expect(courantes.length).toBe(1);
    expect(lu(hote, 'tableau')).toContain('Duree en annees');
  });

  it('regenere la phrase en langage courant a chaque mouvement', () => {
    const avant = lu(hote, 'phrase-texte');
    animer(hote);
    const valeurs = hote.valeurs;
    const resultat = resultatAttendu(valeurs);
    expect(lu(hote, 'phrase-texte')).toBe(
      remplirGabarit(DEFINITION.phrase, { ...valeurs, resultat }, formaterEsperee),
    );
    expect(lu(hote, 'phrase-texte')).not.toBe(avant);
  });

  it('dessine le graphique en svg produit par la brique sans bibliotheque', () => {
    const courbe = un(hote, 'courbe');
    const trace = un(hote, 'trace');
    expect(courbe).toBeInstanceOf(SVGSVGElement);
    expect(trace).toBeInstanceOf(SVGPolylineElement);
    expect((trace?.getAttribute('points') ?? '').split(' ').length).toBe(POINTS_ATTENDUS);
    expect(un(hote, 'point')).toBeInstanceOf(SVGCircleElement);
    expect(tous(hote, 'img, canvas, iframe, object, script')).toEqual([]);
  });

  it('RET-21 · trace la trajectoire depart, apres t1, arrivee avec le niveau de depart en repere', () => {
    hote.definition = MACHINE;
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

  it('RET-21 · liste dans le tableau chaque etape de la machine avec sa valeur', () => {
    hote.definition = MACHINE;

    expect(
      tous(hote, '[data-testid="ligne"]').map((ligne) => ligne.firstElementChild?.textContent),
    ).toEqual(['Départ', 'Après t₁', 'Arrivée']);
    expect(resultatsDuTableau(hote)).toEqual(['100', '110', '99']);
  });

  it('F20 · propose les couples de taux en un clic et marque celui qui est en place', () => {
    hote.definition = MACHINE;

    expect(boutonsDePrereglage(hote).map((bouton) => bouton.textContent?.trim())).toEqual([
      '+10 % puis −10 %',
      '−10 % puis +10 %',
      '+20 % puis −20 %',
    ]);
    expect(boutonsDePrereglage(hote).map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ]);

    prereglage(hote, '+20 % puis −20 %');

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

  it('ramene un defaut hors bornes dans les bornes au lieu de l ignorer', () => {
    hote.definition = avecDefaut('n', 99);
    expect(hote.valeurs['n']).toBe(30);
    expect(lu(hote, 'phrase-texte')).toContain('30 an(s)');
    expect(valeurDe(hote, 'formule')).toBe(String(resultatAttendu({ C: 1000, i: 4, n: 30 })));
  });

  it('annonce chaque parametre en francais lisible et pas par un nombre nu', () => {
    for (const valeur of tous(hote, '[data-testid="valeur"]')) {
      const enonce = valeur.getAttribute('aria-label') ?? '';
      expect(enonce).not.toMatch(/^[\s\d,.]*$/);
      expect(enonce).toContain(' : ');
    }
    expect(
      hote.shadowRoot
        ?.querySelector('[data-testid="valeur"][data-cle="n"]')
        ?.getAttribute('aria-label'),
    ).toBe('Duree en annees : 10 (de 1 à 30)');
    expect(
      hote.shadowRoot
        ?.querySelector('[data-testid="curseur"][data-cle="n"]')
        ?.getAttribute('aria-label'),
    ).toBe('Duree en annees : 10 (de 1 à 30)');
  });

  it('echappe le html injecte dans la formule, les libelles et la phrase', () => {
    hote.definition = buildConcept4Definition({
      id: 'K-QUATRE-FACES-03',
      formuleLatexSimplifie: CHARGE_XSS,
      phrase: CHARGE_XSS,
      parametres: DEFINITION.parametres.map((parametre) => ({ ...parametre, libelle: CHARGE_XSS })),
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(lu(hote, 'phrase-texte')).toBe(CHARGE_XSS);
    expect(lu(hote, 'formule')).toContain(CHARGE_XSS);
    expect(
      hote.shadowRoot
        ?.querySelector('[data-testid="valeur"][data-cle="n"]')
        ?.getAttribute('aria-label'),
    ).toContain(CHARGE_XSS);
    expect(hote.shadowRoot?.innerHTML ?? '').toContain('&lt;img');
  });

  it('affiche un tiret quand la formule de calcul est invalide sans casser la brique', () => {
    hote.definition = buildConcept4Definition({ id: 'K-QUATRE-FACES-05', calcul: 'C+' });
    expect(lu(hote, 'resultat-formule')).toBe('—');
    expect(resultatsDuTableau(hote).every((resultat) => resultat === '—')).toBe(true);
    expect(lu(hote, 'phrase-texte')).toContain('— €.');
    expect(un(hote, 'courbe')).toBeInstanceOf(SVGSVGElement);
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
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe('etudiant');

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
    expect(hote.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role')).toBe(
      'presentateur',
    );
  });

  it('RET-21 · laisse le formateur manipuler la machine en projection', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    const curseurDeN = hote.shadowRoot?.querySelector<HTMLInputElement>(
      '[data-testid="curseur"][data-cle="n"]',
    );
    if (curseurDeN === null || curseurDeN === undefined) {
      throw new Error('aucun curseur projete pour n');
    }
    curseurDeN.value = '20';
    curseurDeN.dispatchEvent(new Event('input', { bubbles: true }));

    expect(hote.valeurs['n']).toBe(20);
    expect(valeurDe(hote, 'formule')).toBe(String(resultatAttendu({ C: 1000, i: 4, n: 20 })));
    expect(tous(hote, '[data-testid="animer"]').length).toBe(1);
  });

  describe('synchronisation du pupitre vers la projection', () => {
    function reglerN(valeur: string): void {
      const curseurDeN = hote.shadowRoot?.querySelector<HTMLInputElement>(
        '[data-testid="curseur"][data-cle="n"]',
      );
      if (curseurDeN === null || curseurDeN === undefined) {
        throw new Error('aucun curseur pour n');
      }
      curseurDeN.value = valeur;
      curseurDeN.dispatchEvent(new Event('input', { bubbles: true }));
      curseurDeN.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function reglagesEmis(): unknown[] {
      const emis: unknown[] = [];
      hote.addEventListener('fp-concept4-reglage', (evenement) =>
        emis.push((evenement as CustomEvent).detail),
      );
      return emis;
    }

    it('RET-21 · au pupitre, emet les reglages une fois le curseur relache', () => {
      hote.setAttribute('data-cours-role', 'presentateur');
      const emis = reglagesEmis();

      reglerN('20');

      expect(emis).toEqual([{ reglages: { C: 1000, i: 4, n: 20 } }]);
    });

    it('RET-21 · au pupitre, n emet rien tant que le curseur glisse sans etre relache', () => {
      hote.setAttribute('data-cours-role', 'presentateur');
      const emis = reglagesEmis();
      const curseurDeN = hote.shadowRoot?.querySelector<HTMLInputElement>(
        '[data-testid="curseur"][data-cle="n"]',
      );
      if (curseurDeN === null || curseurDeN === undefined) {
        throw new Error('aucun curseur pour n');
      }

      curseurDeN.value = '20';
      curseurDeN.dispatchEvent(new Event('input', { bubbles: true }));

      expect(emis).toEqual([]);
      expect(hote.valeurs['n']).toBe(20);
    });

    it('RET-21 · en apercu, le pupitre n emet aucun reglage vers la seance', () => {
      hote.setAttribute('data-cours-role', 'presentateur');
      hote.setAttribute('data-apercu', '');
      const emis = reglagesEmis();

      reglerN('20');

      expect(emis).toEqual([]);
      expect(hote.valeurs['n']).toBe(20);
    });

    it('RET-21 · chez l etudiant, la machine reste une exploration personnelle', () => {
      const emis = reglagesEmis();

      reglerN('20');

      expect(emis).toEqual([]);
      expect(hote.valeurs['n']).toBe(20);
    });

    it('F20 · au pupitre, emet les reglages au clic d un prereglage', () => {
      hote.definition = MACHINE;
      hote.setAttribute('data-cours-role', 'presentateur');
      const emis = reglagesEmis();

      prereglage(hote, '+20 % puis −20 %');

      expect(emis).toEqual([{ reglages: { depart: 100, tauxUn: 20, tauxDeux: -20 } }]);
    });

    it('F20 · chez l etudiant, un prereglage regle la machine sans rien emettre', () => {
      hote.definition = MACHINE;
      const emis = reglagesEmis();

      prereglage(hote, '−10 % puis +10 %');

      expect(emis).toEqual([]);
      expect(hote.valeurs).toEqual({ depart: 100, tauxUn: -10, tauxDeux: 10 });
    });

    it('RET-21 · la projection suit les reglages pilotes, bornes a la machine', () => {
      hote.setAttribute('data-cours-role', 'presentateur');

      hote.reglages = { n: 20, i: 99 };

      expect(hote.valeurs).toEqual({ C: 1000, i: 10, n: 20 });
      expect(valeurDe(hote, 'formule')).toBe(String(resultatAttendu({ C: 1000, i: 10, n: 20 })));
    });

    describe('R8 · animation de la machine à coefficients', () => {
      const ANIMEE = buildConcept4Definition({
        ...MACHINE,
        animation: [{ depart: 100, tauxUn: 0, tauxDeux: 0 }, { tauxUn: 50 }, { tauxDeux: -50 }],
      });

      beforeEach(() => {
        jasmine.clock().install();
        hote.definition = ANIMEE;
      });

      afterEach(() => {
        jasmine.clock().uninstall();
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
        hote.setAttribute('data-cours-role', 'presentateur');
        const emis = reglagesEmis();

        animer(hote);
        jasmine.clock().tick(6000);

        expect(emis).toEqual([
          { reglages: { depart: 100, tauxUn: 0, tauxDeux: 0 } },
          { reglages: { depart: 100, tauxUn: 50, tauxDeux: 0 } },
          { reglages: { depart: 100, tauxUn: 50, tauxDeux: -50 } },
        ]);
      });

      it('s arrête dès qu un préréglage est choisi', () => {
        animer(hote);
        prereglage(hote, '+10 % puis −10 %');
        jasmine.clock().tick(6000);

        expect(hote.valeurs).toEqual({ depart: 100, tauxUn: 10, tauxDeux: -10 });
      });
    });
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    attendreLaCorrectionNicheeEffacee(
      buildConcept4Definition({ id: 'K-QUATRE-FACES-04' }),
      (contamine) => {
        hote.definition = contamine;
        return hote.definition;
      },
    );
  });

  it('explore sans rien emettre vers la seance ni ecrire dans un stockage', () => {
    animer(hote);
    attendreAucunEffet(traces);
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    attendreChaqueClasseCouverte(hote, 'concept4', CLASSES_ATTENDUES);
  });
});
