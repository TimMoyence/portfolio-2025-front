import { Component, input } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { EcranContent, PieceJointe } from '../../../../cours/content/types';
import { noeudOmbre, noeudsOmbre } from '../../../../testing/banc-de-brique';
import { attendreQue, DELAI_DE_MONTAGE_MS } from '../../../../testing/briques-montees';
import { deuxImages } from '../../../../testing/deux-images';
import {
  ecransDuPupitreB2_01,
  ecransPublicsB2_01,
} from '../../../../testing/fixtures/instantane-b2-01';
import { INSTANTANE_B2_04 } from '../../../../testing/fixtures/instantane-b2-04';
import { INSTANTANE_B3_01 } from '../../../../testing/fixtures/instantane-b3-01';
import {
  ecranReveleAuPosteEtudiant,
  ecransDuPupitreDe,
  ecransPublicsDe,
} from '../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../testing/fixtures/instantanes-des-cours';
import { libellesColles } from '../../../../testing/libelles-colles';
import { lignesDe } from '../../../../testing/lignes-de-texte';
import { chargerLesPolicesDeLApplication } from '../../../../testing/polices';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { valeursSurUneForme } from '../../../../testing/valeurs-sur-les-formes';
import { annexeFormateurDeLEcran } from '../../../features/cours/presentateur/annexe-formateur';
import { presentationDe } from '../visual/presentation-v2';
import type { DirectEcran } from './contrat-hote';
import { ecranDIdentifiant } from './lecture-ecran';
import { of, Subject, throwError } from 'rxjs';
import type { FichierTelecharge } from '../../../core/ports/formations.port';
import { PieceJointeRefusee } from '../../../core/ports/formations.port';
import { buildFichierTelecharge } from '../../../../testing/factories/formations.factory';
import { jouerLesGraphiquesJusquAuBout } from '../../../../testing/graphique-monte';
import {
  CoursPresentationComponent,
  type CoursPresentationMode,
  type TelechargementDePieceJointe,
} from './cours-presentation.component';

const POSTES = ['cours-etudiant', 'cours-presentateur'] as const;

const COURS_MESURES = INSTANTANES_DES_COURS_SERVIS.map(([code, instantane]) => ({
  code,
  instantane,
  pupitre: ecransDuPupitreDe(instantane),
  publics: ecransPublicsDe(instantane),
}));

const COURS_A_RENVOIS = COURS_MESURES.filter(({ pupitre }) =>
  pupitre.some(({ renvoi }) => renvoi !== undefined),
);

const ECRANS_DU_PUPITRE = new Map(
  COURS_MESURES.flatMap(({ pupitre }) => pupitre.map((ecran) => [ecran.id, ecran] as const)),
);

const TABLEURS_DES_COURS = COURS_MESURES.flatMap(({ pupitre }) =>
  pupitre
    .filter(({ type }) => type === 'fp-sheet')
    .map((ecran) => ({ ecran, renvoi: ecranDIdentifiant(pupitre, ecran.renvoi) ?? null })),
);

const TABLEURS_PROJETES = TABLEURS_DES_COURS.flatMap((tableur) =>
  (['projection', 'formateur'] as const).map((mode) => ({ ...tableur, mode })),
);

@Component({
  standalone: true,
  imports: [CoursPresentationComponent],
  template: `
    <app-cours-presentation mode="projection" [slide]="slide()" [surimpression]="calque" />
    <ng-template #calque
      ><p data-testid="surimpression" style="margin: 0; block-size: 15rem">45,5</p></ng-template
    >
  `,
})
class HoteAvecSurimpressionComponent {
  readonly slide = input.required<EcranContent>();
}

interface EcranCadre {
  readonly cadre: HTMLElement;
  readonly hote: HTMLElement;
  readonly toile: () => HTMLElement | null;
  readonly brique: () => HTMLElement | null;
  readonly rafraichir: () => Promise<void>;
  readonly afficher: (ecran: EcranContent) => Promise<void>;
  readonly piloter: (direct: DirectEcran | null) => Promise<void>;
  readonly detruire: () => void;
}

function ecranDuPupitre(suffixe: string): EcranContent {
  const ecran = ecransDuPupitreB2_01().find(({ id }) => id.endsWith(suffixe));
  if (ecran === undefined) {
    throw new Error(`écran absent du pupitre : ${suffixe}`);
  }
  return ecran;
}

function ecranB2_01Du(mode: CoursPresentationMode, suffixe: string): EcranContent {
  if (mode !== 'etudiant') {
    return ecranDuPupitre(suffixe);
  }
  const ecran = ecransPublicsB2_01().find(({ id }) => id.endsWith(suffixe));
  if (ecran === undefined) {
    throw new Error(`écran absent du poste étudiant : ${suffixe}`);
  }
  return ecran;
}

function monterDansUnCadre(
  ecran: EcranContent,
  mode: CoursPresentationMode,
  largeur: number,
  hauteur: number,
  renvoi: EcranContent | null = null,
  direct: DirectEcran | null = null,
  telechargement: TelechargementDePieceJointe | null = null,
): Promise<EcranCadre> {
  const cadre = document.createElement('div');
  cadre.style.cssText = `position:fixed;top:0;left:0;width:${largeur}px;height:${hauteur}px;display:flex;overflow:auto;`;
  return monterDans(cadre, cadre, ecran, mode, renvoi, direct, telechargement);
}

function monterAuTelephone(ecran: EcranContent, renvoi: EcranContent | null): Promise<EcranCadre> {
  const page = document.createElement('section');
  page.className = 'student-session';
  page.style.cssText = `position:fixed;top:0;left:0;width:${CADRE_TELEPHONE.largeur}px;height:${CADRE_TELEPHONE.hauteur}px;`;
  const cadre = document.createElement('div');
  cadre.className = 'student-session__cadre';
  page.appendChild(cadre);
  return monterDans(page, cadre, ecran, 'etudiant', renvoi);
}

async function monterDans(
  page: HTMLElement,
  cadre: HTMLElement,
  ecran: EcranContent,
  mode: CoursPresentationMode,
  renvoi: EcranContent | null,
  direct: DirectEcran | null = null,
  telechargement: TelechargementDePieceJointe | null = null,
): Promise<EcranCadre> {
  document.body.appendChild(page);
  const fixture = TestBed.createComponent(CoursPresentationComponent);
  cadre.appendChild(fixture.nativeElement as HTMLElement);
  fixture.componentRef.setInput('mode', mode);
  fixture.componentRef.setInput('slide', ecran);
  if (renvoi !== null) {
    fixture.componentRef.setInput('renvoi', renvoi);
  }
  fixture.componentRef.setInput('direct', direct);
  fixture.componentRef.setInput('telechargement', telechargement);
  const deroule = ECRANS_DU_PUPITRE.get(ecran.id);
  if (mode !== 'etudiant' && deroule !== undefined) {
    fixture.componentRef.setInput('donneesFormateur', annexeFormateurDeLEcran(deroule));
  }
  const racine = fixture.nativeElement as HTMLElement;
  const toile = (): HTMLElement | null =>
    racine.querySelector<HTMLElement>('[data-testid="cours-toile"]');
  const brique = (): HTMLElement | null =>
    racine.querySelector<HTMLElement>(
      '[data-testid="cours-contenu"] app-slide-activity [data-cours-role]',
    );
  await attendreQue(
    fixture,
    () => racine.querySelector('app-slide-activity *') !== null,
    `l écran ${ecran.id} en ${mode}`,
  );
  await new Promise((suite) => setTimeout(suite, 50));
  fixture.detectChanges();
  const rafraichir = async (): Promise<void> => {
    await new Promise((suite) => setTimeout(suite, 50));
    fixture.detectChanges();
  };
  return {
    cadre,
    hote: racine,
    toile,
    brique,
    rafraichir,
    afficher: async (suivant) => {
      fixture.componentRef.setInput('slide', suivant);
      await rafraichir();
    },
    piloter: async (suivant) => {
      fixture.componentRef.setInput('direct', suivant);
      await rafraichir();
    },
    detruire: () => {
      fixture.destroy();
      page.remove();
    },
  };
}

const PILOTAGE_REVELE: DirectEcran = {
  pilotage: { revele: true, explicationsDevoilees: 20, etayage: 20 },
  resultats: null,
  comptesJalon: null,
};

async function stabiliser(monte: EcranCadre, passes: number): Promise<void> {
  for (let passe = 0; passe < passes; passe += 1) {
    await monte.rafraichir();
  }
}

async function monterReveleEnProjection(
  pupitre: readonly EcranContent[],
  suffixe: string,
): Promise<EcranCadre> {
  const ecran = pupitre.find(({ id }) => id.endsWith(suffixe));
  if (ecran === undefined) {
    throw new Error(`écran absent du pupitre : ${suffixe}`);
  }
  const renvoi = ecranDIdentifiant(pupitre, ecran.renvoi) ?? null;
  const monte = await monterDansUnCadre(ecran, 'projection', 1280, 720, renvoi, PILOTAGE_REVELE);
  await stabiliser(monte, 8);
  return monte;
}

function ecransARenvoiDesCours(
  ecransDe: (instantane: (typeof COURS_MESURES)[number]['instantane']) => readonly EcranContent[],
): { readonly ecran: EcranContent; readonly renvoi: EcranContent | null }[] {
  return COURS_MESURES.flatMap(({ instantane, pupitre }) =>
    ecransDe(instantane)
      .filter(({ renvoi }) => renvoi !== undefined)
      .map((ecran) => ({ ecran, renvoi: ecranDIdentifiant(pupitre, ecran.renvoi) ?? null })),
  );
}

function constaterLesProjectionsARenvoi(
  pupitre: readonly EcranContent[],
  constater: (ecran: EcranContent, monte: EcranCadre) => string | null,
): Promise<string[]> {
  return fautesDesEcrans(
    pupitre.filter(({ renvoi }) => renvoi !== undefined),
    pupitre,
    (ecran, renvoi) => monterDansUnCadre(ecran, 'projection', 1280, 720, renvoi),
    async (ecran, monte) => {
      await stabiliser(monte, 6);
      return constater(ecran, monte);
    },
  );
}

async function fautesDesEcrans(
  ecrans: readonly EcranContent[],
  pupitre: readonly EcranContent[],
  monter: (ecran: EcranContent, renvoi: EcranContent | null) => Promise<EcranCadre>,
  constater: (ecran: EcranContent, monte: EcranCadre) => Promise<string | null> | string | null,
): Promise<string[]> {
  const fautes: string[] = [];
  for (const ecran of ecrans) {
    const monte = await monter(ecran, ecranDIdentifiant(pupitre, ecran.renvoi) ?? null);
    const faute = await constater(ecran, monte);
    if (faute !== null) {
      fautes.push(faute);
    }
    monte.detruire();
  }
  return fautes;
}

function itSansEcranFautif(
  titre: string,
  ecrans: readonly EcranContent[],
  pupitre: readonly EcranContent[],
  monter: (ecran: EcranContent, renvoi: EcranContent | null) => Promise<EcranCadre>,
  fautesDeLEcran: (ecran: EcranContent, monte: EcranCadre) => Promise<readonly string[]>,
): void {
  it(
    titre,
    async () => {
      const fautes = await fautesDesEcrans(ecrans, pupitre, monter, async (ecran, monte) => {
        const faute = await fautesDeLEcran(ecran, monte);
        return faute.length > 0 ? `${ecran.id} ${faute.join(',')}` : null;
      });

      expect(fautes).toEqual([]);
    },
    DELAI_DE_MONTAGE_MS,
  );
}

describe('CoursPresentationComponent : un seul écran pour la projection et le pupitre', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  it('mesure les écrans avec les polices servies par l application, quelle que soit la machine', async () => {
    expect(await chargerLesPolicesDeLApplication()).toEqual([
      'Geist Mono',
      'Hanken Grotesk',
      'Indices Serif',
      'Instrument Serif',
    ]);
  });

  it('G1 · rend l aperçu formateur dans une toile 1280 × 720 mise à l échelle de son cadre', async () => {
    const monte = await monterDansUnCadre(
      ecranDuPupitre('A1-09-DIAPOSITIVE'),
      'formateur',
      640,
      900,
    );
    const rect = monte.toile()?.getBoundingClientRect();

    expect(monte.toile()?.offsetWidth).toBe(1280);
    expect(monte.toile()?.offsetHeight).toBe(720);
    expect(rect?.width).toBeCloseTo(640, 0);
    expect(rect?.height).toBeCloseTo(360, 0);
    monte.detruire();
  });

  it('G1 · centre la toile de projection dans une scène qui n est pas en 16:9', async () => {
    const monte = await monterDansUnCadre(
      ecranDuPupitre('A1-09-DIAPOSITIVE'),
      'projection',
      1000,
      1000,
    );
    const rect = monte.toile()?.getBoundingClientRect();

    expect(rect?.width).toBeCloseTo(1000, 0);
    expect(rect?.height).toBeCloseTo(562.5, 0);
    expect(rect?.top).toBeCloseTo((1000 - 562.5) / 2, 0);
    monte.detruire();
  });

  for (const [reference, suffixe] of [
    ['G1', 'A1-09-DIAPOSITIVE'],
    ['G1', 'A2-01-PLAYFAIR'],
    ['E13', 'A2-02-ORIGINE-AXE'],
    ['E14', 'A2-03-ATELIER-1'],
    ['R6', 'A5-04-SIMULATEUR-MIX'],
    ['RET-22', 'A3-03-PRIX-SAC'],
    ['RET-26', 'A3-07-ATELIER-2'],
    ['RET-27', 'A3-08-INDICE-PRIX'],
    ['F33', 'A5-07-CONTROLE-DISCRIMINANT'],
    ['F33', 'A5-07-CORRECTION'],
  ] as const) {
    for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
      it(`${reference} · ${suffixe} tient dans la toile sans défilement en ${mode}`, async () => {
        const ecran = ecranB2_01Du(mode, suffixe);
        const renvoi = ecranDIdentifiant(ecransDuPupitreB2_01(), ecran.renvoi) ?? null;
        const monte = await monterDansUnCadre(ecran, mode, 1280, 720, renvoi);
        const toile = monte.toile();

        if (!defilante(monte)) {
          expect(toile?.scrollHeight).withContext('hauteur du contenu').toBeLessThanOrEqual(720);
          expect(toile?.scrollWidth).withContext('largeur du contenu').toBeLessThanOrEqual(1280);
        }
        expect(elementsPerdus(monte)).withContext('éléments coupés').toEqual([]);
        monte.detruire();
      });
    }
  }

  COURS_MESURES.forEach(decrireLaTenueDuCours);

  it('G01 · au poste étudiant, le contenu d une toile réduite garde 0,8 et celui d une toile agrandie s affiche au moins à 0,8', async () => {
    const jeu = ecransPublicsB2_01().find(({ id }) => id.endsWith(ECRAN_TROP_LONG));
    if (jeu === undefined) {
      throw new Error(`écran absent du poste étudiant : ${ECRAN_TROP_LONG}`);
    }
    const reduite = await monterDansUnCadre(jeu, 'etudiant', 1350, 700);

    expect(echelleDuContenu(reduite.toile())).toBeCloseTo(ECHELLE_MINIMALE, 3);
    reduite.detruire();

    const agrandie = await monterDansUnCadre(
      jeu,
      'etudiant',
      CADRE_ETUDIANT_14_POUCES.largeur,
      CADRE_ETUDIANT_14_POUCES.hauteur,
    );

    expect(echelleAffichee(agrandie)).toBeGreaterThanOrEqual(ECHELLE_MINIMALE - 0.001);
    agrandie.detruire();
  });

  for (const mode of ['formateur', 'projection'] as const) {
    it(`G01 · en ${mode}, un écran trop long ne défile jamais : il est mis à l échelle de la toile`, async () => {
      const ecrans = ecransDuPupitreB2_01();
      const jeu = ecranDuPupitre(ECRAN_TROP_LONG);
      const renvoi = ecranDIdentifiant(ecrans, jeu.renvoi) ?? null;
      const monte = await monterDansUnCadre(jeu, mode, 1280, 720, renvoi);

      expect(monte.hote.classList).not.toContain('cours-presentation--defilante');
      expect(echelleDuContenu(monte.toile())).toBeLessThan(1);
      expect(elementsHorsToile(monte)).toEqual([]);
      monte.detruire();
    });
  }

  it('G01 · T3 · au poste étudiant, un écran trop long garde une taille lisible et fait défiler la page', async () => {
    const ecrans = ecransPublicsB2_01();
    const jeu = ecrans.find(({ id }) => id.endsWith(ECRAN_TROP_LONG));
    if (jeu === undefined) {
      throw new Error(`écran absent du poste étudiant : ${ECRAN_TROP_LONG}`);
    }
    const renvoi = ecranDIdentifiant(ecrans, jeu.renvoi) ?? null;
    const monte = await monterDansUnCadre(jeu, 'etudiant', 1280, 720, renvoi);
    const brique = monte.brique();
    const valider = brique === null ? null : noeudOmbre(brique, 'valider');

    expect(monte.hote.classList).toContain('cours-presentation--defilante');
    expect(echelleDuContenu(monte.toile())).toBeGreaterThanOrEqual(ECHELLE_MINIMALE);
    expect(monte.cadre.scrollHeight).toBeGreaterThan(monte.cadre.clientHeight);
    expect(valider).withContext('bouton de validation du tri').toBeTruthy();
    expect(elementsHorsDeLaPage(monte)).toEqual([]);
    expect(defileursInternes(monte.toile() as HTMLElement)).toEqual([]);
    monte.detruire();
  });

  it(
    'QF-5 · un écran à renvoi trop réduit élargit sa colonne, et sa diapositive commentée suit le défilement s il reste trop long',
    async () => {
      const releves: string[] = [];
      for (const { ecran, renvoi } of ecransARenvoiDesCours(ecransPublicsDe)) {
        const monte = await monterDansUnCadre(ecran, 'etudiant', 1280, 720, renvoi);
        await stabiliser(monte, 2);
        const commentee = monte.hote.querySelector('[data-testid="cours-renvoi"]');
        const elargi = monte.hote.classList.contains('cours-presentation--renvoi-reduit');
        const masque = monte.hote.classList.contains('cours-presentation--renvoi-masque');
        if (masque) {
          expect(commentee).withContext(ecran.id).toBeNull();
        } else if (elargi) {
          expect(commentee?.getBoundingClientRect().width)
            .withContext(ecran.id)
            .toBeCloseTo(monte.cadre.clientWidth * 0.4, 0);
        }
        if (defilante(monte) && !masque) {
          monte.cadre.scrollTop = monte.cadre.scrollHeight;
          await monte.rafraichir();
          const ecart =
            (commentee?.getBoundingClientRect().top ?? Number.NaN) -
            monte.cadre.getBoundingClientRect().top;
          expect(elargi).withContext(ecran.id).toBeTrue();
          expect(monte.cadre.scrollTop).withContext(ecran.id).toBeGreaterThan(0);
          expect(Math.abs(ecart)).withContext(ecran.id).toBeLessThanOrEqual(2);
        }
        releves.push(
          `${ecran.id} ${masque ? 'masqué, ' : ''}${elargi ? 'élargi' : 'plein'}${defilante(monte) ? ' défilant' : ''}`,
        );
        monte.detruire();
      }

      expect(releves.filter((releve) => releve.includes('élargi')).length)
        .withContext(releves.join(' | '))
        .toBeGreaterThan(0);
      expect(releves.filter((releve) => releve.includes('défilant')).length)
        .withContext(releves.join(' | '))
        .toBeGreaterThan(0);
    },
    DELAI_DE_MONTAGE_MS,
  );

  it('QF-19 · en projection, le titre d un graphique tient sur une ligne et laisse sa hauteur au tracé', async () => {
    const graphique = ecransDuPupitreDe(INSTANTANE_B2_04).find(({ id }) =>
      id.endsWith('A3-01-GRAPHIQUE'),
    );
    if (graphique === undefined) {
      throw new Error('écran absent du pupitre : A3-01-GRAPHIQUE');
    }
    const monte = await monterDansUnCadre(graphique, 'projection', 1280, 720);
    await monte.rafraichir();
    const titre = monte.hote.querySelector<HTMLElement>('.slide-chart h2');
    const trace = monte.hote.querySelector<HTMLElement>('[data-testid="slide-chart-zone"]');
    const interligne = Number.parseFloat(getComputedStyle(titre as HTMLElement).fontSize) * 1.5;
    expect(titre?.offsetHeight).toBeLessThan(interligne);
    expect(trace?.offsetHeight).toBeGreaterThanOrEqual(200);
    monte.detruire();
  });

  it(
    'QF-15 · en projection, un écran encore illisible une fois sa colonne élargie retire la diapositive commentée et reprend toute la toile',
    async () => {
      const releves: string[] = [];
      for (const { ecran, renvoi } of ecransARenvoiDesCours(ecransDuPupitreDe)) {
        const monte = await monterDansUnCadre(
          ecran,
          'projection',
          1280,
          720,
          renvoi,
          PILOTAGE_REVELE,
        );
        await stabiliser(monte, 2);
        const masque = monte.hote.classList.contains('cours-presentation--renvoi-masque');
        const commentee = monte.hote.querySelector('[data-testid="cours-renvoi"]');
        if (masque) {
          expect(commentee).withContext(ecran.id).toBeNull();
          expect(monte.toile()?.classList)
            .withContext(ecran.id)
            .not.toContain('cours-toile--renvoi');
        } else {
          expect(commentee).withContext(ecran.id).not.toBeNull();
          expect(echelleDuContenu(monte.toile()))
            .withContext(ecran.id)
            .toBeGreaterThanOrEqual(ECHELLE_MINIMALE - 0.001);
        }
        releves.push(`${ecran.id} ${masque ? 'masqué' : 'gardé'}`);
        monte.detruire();
      }

      expect(releves.filter((releve) => releve.endsWith('masqué')).length)
        .withContext(releves.join(' | '))
        .toBeGreaterThan(0);
      expect(releves.filter((releve) => releve.endsWith('gardé')).length)
        .withContext(releves.join(' | '))
        .toBeGreaterThan(0);
    },
    DELAI_DE_MONTAGE_MS,
  );

  it(
    'QF-22 · en projection, un questionnaire révélé s étale sur toute la largeur de la toile au lieu de rétrécir au centre',
    async () => {
      const pupitre = ecransDuPupitreDe(INSTANTANE_B2_04);
      const etales: string[] = [];
      for (const suffixe of [
        'A1-10-ATELIER-ARITHMETIQUE',
        'A2-05-ATELIER-GEOMETRIQUE',
        'A3-07-ATELIER-SEUIL',
      ]) {
        const monte = await monterReveleEnProjection(pupitre, suffixe);
        const contenu = monte.hote.querySelector<HTMLElement>('[data-testid="cours-contenu"]');
        const masque = monte.hote.classList.contains('cours-presentation--renvoi-masque');

        if (masque) {
          etales.push(suffixe);
          expect(contenu?.getBoundingClientRect().width)
            .withContext(`largeur affichée de ${suffixe}`)
            .toBeGreaterThanOrEqual(1100);
        }
        expect(echelleDuContenu(monte.toile()))
          .withContext(`échelle de ${suffixe}`)
          .toBeGreaterThanOrEqual(ECHELLE_MINIMALE - 0.06);
        expect(elementsHorsToile(monte)).withContext(suffixe).toEqual([]);
        monte.detruire();
      }

      expect(etales.length).toBeGreaterThan(0);
    },
    DELAI_DE_MONTAGE_MS,
  );

  it(
    'QF-24 · en projection, un écran n est étalé que s il remplit ensuite la hauteur de la toile',
    async () => {
      const pupitre = ecransDuPupitreDe(INSTANTANE_B2_04);
      const etalesSansBesoin = await fautesDesEcrans(
        pupitre,
        pupitre,
        (ecran) => monterDansUnCadre(ecran, 'projection', 1280, 720, null, PILOTAGE_REVELE),
        async (ecran, monte) => {
          await stabiliser(monte, 8);
          const contenu = monte.hote.querySelector<HTMLElement>('[data-testid="cours-contenu"]');
          const diapositive = contenu?.querySelector<HTMLElement>('app-slide');
          const etale = (contenu?.style.inlineSize ?? '') !== '';
          const hauteur = diapositive?.getBoundingClientRect().height ?? 0;
          return etale && hauteur < 720 * 0.55
            ? `${ecran.id} (${String(Math.round(hauteur))})`
            : null;
        },
      );

      expect(etalesSansBesoin).toEqual([]);
    },
    DELAI_DE_MONTAGE_MS,
  );

  it(
    'R-03 · en projection, une activité corrigée trop haute s étale sur toute la largeur de la toile au lieu de rester plafonnée au centre',
    async () => {
      const monte = await monterReveleEnProjection(
        ecransDuPupitreDe(INSTANTANE_B3_01),
        'A1-13-TRI-ANOMALIES',
      );
      const blocs = monte.hote.querySelector<HTMLElement>('.slide-activity__blocks');

      expect(blocs?.getBoundingClientRect().width).toBeGreaterThanOrEqual(1100);
      expect(echelleDuContenu(monte.toile())).toBeGreaterThan(0.55);
      expect(elementsHorsToile(monte)).toEqual([]);
      monte.detruire();
    },
    DELAI_DE_MONTAGE_MS,
  );

  it('QA-08 · mesure les tableurs de tous les cours servis', () => {
    expect(TABLEURS_DES_COURS.length).toBeGreaterThan(0);
  });

  for (const { ecran, renvoi, mode } of TABLEURS_PROJETES) {
    it(
      `QA-08 · ${ecran.id} en ${mode}, formules affichées, tient dans la toile en largeur comme en hauteur, sans défileur horizontal`,
      async () => {
        const monte = await monterDansUnCadre(ecran, mode, 1280, 720, renvoi, PILOTAGE_REVELE);
        await stabiliser(monte, 8);

        expect(
          elementsDe(monte.hote).filter((element) =>
            element.matches('[data-testid="correction-feuille"] code'),
          ).length,
        )
          .withContext('formules affichées')
          .toBeGreaterThan(0);
        expect(ecranRogneEnLargeur(ecran, monte)).toBeNull();
        expect(elementsHorsToileEnLargeur(monte)).toEqual([]);
        expect(elementsHorsToile(monte)).toEqual([]);
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  }

  it('mesure les écrans à renvoi de chaque cours servi qui en porte, et au moins d un cours', () => {
    expect(COURS_A_RENVOIS.length).toBeGreaterThan(0);
  });

  for (const { code, pupitre, publics } of COURS_A_RENVOIS) {
    for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
      it(
        `T1 ·chaque écran à renvoi du ${code} tient entier dans sa demi-toile en ${mode}, titre compris`,
        async () => {
          const aRenvoi = pupitre.filter(({ renvoi }) => renvoi !== undefined);
          expect(publics.filter(({ renvoi }) => renvoi !== undefined).map(({ id }) => id))
            .withContext(`écrans à renvoi du ${code} au poste étudiant`)
            .toEqual(aRenvoi.map(({ id }) => id));
          const coupes = await fautesDesEcrans(
            aRenvoi,
            pupitre,
            (ecran, renvoi) => monterDansUnCadre(ecran, mode, 1280, 720, renvoi),
            async (ecran, monte) => {
              await new Promise((suite) => setTimeout(suite, 50));
              const horsToile = elementsPerdus(monte);
              return horsToile.length > 0 ? `${ecran.id} (${horsToile.join(',')})` : null;
            },
          );

          expect(coupes).toEqual([]);
        },
        DELAI_DE_MONTAGE_MS,
      );
    }
  }

  for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
    it(`G09 · ORIGINE-AXE remplit sa colonne en ${mode} au lieu d être réduit`, async () => {
      const ecrans = ecransDuPupitreB2_01();
      const ecran = ecranDuPupitre('A2-02-ORIGINE-AXE');
      const renvoi = ecranDIdentifiant(ecrans, ecran.renvoi) ?? null;
      const monte = await monterDansUnCadre(ecran, mode, 1280, 720, renvoi);
      await new Promise((suite) => setTimeout(suite, 50));
      const principal = monte.toile()?.querySelector<HTMLElement>('.cours-toile__principal');
      const style =
        principal === null || principal === undefined ? null : getComputedStyle(principal);
      const colonne =
        (principal?.clientWidth ?? 0) -
        Number.parseFloat(style?.paddingInlineStart ?? '0') -
        Number.parseFloat(style?.paddingInlineEnd ?? '0');
      const carte = monte.brique()?.shadowRoot?.querySelector('.fp-plot__atelier');

      expect(carte?.getBoundingClientRect().width ?? 0).toBeGreaterThanOrEqual(colonne * 0.9);
      monte.detruire();
    });
  }

  it('R1 · pose dans la toile la surimpression fournie par le poste', () => {
    const fixture = TestBed.createComponent(HoteAvecSurimpressionComponent);
    fixture.componentRef.setInput('slide', ecranDuPupitre('A2-03-ATELIER-1'));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="cours-toile"] [data-testid="surimpression"]',
      )?.textContent,
    ).toBe('45,5');
    fixture.destroy();
  });

  it('QF-23 · réserve au contenu la place que prend la surimpression, sans la laisser le recouvrir', async () => {
    const cadre = document.createElement('div');
    cadre.style.cssText = 'position:fixed;top:0;left:0;width:1280px;height:720px;display:flex;';
    document.body.appendChild(cadre);
    const fixture = TestBed.createComponent(HoteAvecSurimpressionComponent);
    const racine = fixture.nativeElement as HTMLElement;
    racine.style.cssText = 'flex:1;block-size:100%;';
    cadre.appendChild(racine);
    fixture.componentRef.setInput('slide', ecranDuPupitre('A2-03-ATELIER-1'));
    await attendreQue(
      fixture,
      () => racine.querySelector('app-slide-activity *') !== null,
      'l écran sous sa surimpression',
    );
    for (let tour = 0; tour < 4; tour += 1) {
      await new Promise((suite) => setTimeout(suite, 50));
      fixture.detectChanges();
    }

    const bord = (selecteur: string): DOMRect | undefined =>
      racine.querySelector<HTMLElement>(selecteur)?.getBoundingClientRect();
    const surimpression = bord('[data-testid="surimpression"]');
    const toile = bord('[data-testid="cours-toile"]');

    expect(surimpression?.height).toBeGreaterThan(200);
    expect(bord('.cours-toile__principal')?.bottom).toBeLessThanOrEqual(
      (surimpression?.top ?? 0) + 1,
    );
    expect(bord('[data-testid="cours-contenu"]')?.bottom).toBeLessThanOrEqual(
      (surimpression?.top ?? 0) + 1,
    );
    expect(surimpression?.bottom).toBeLessThanOrEqual((toile?.bottom ?? 0) + 1);
    fixture.destroy();
    cadre.remove();
  });

  it('G1 · garde la même taille logique de titre quelle que soit la largeur du cadre', async () => {
    const tailleDuTitre = async (largeur: number): Promise<string | undefined> => {
      const monte = await monterDansUnCadre(
        ecranDuPupitre('A1-09-DIAPOSITIVE'),
        'formateur',
        largeur,
        2000,
      );
      const titre = monte.toile()?.querySelector('h1, h2');
      const taille =
        titre === null || titre === undefined ? undefined : getComputedStyle(titre).fontSize;
      const toile = monte.toile()?.getBoundingClientRect().width;
      monte.detruire();
      return toile === undefined ? undefined : `${taille}@${Math.round(toile / largeur)}`;
    };

    expect(await tailleDuTitre(540)).toBe(await tailleDuTitre(1280));
    expect(await tailleDuTitre(540)).toMatch(/px@1$/);
  });

  it('E10 · place la miniature de la diapositive de Samir dans la toile, à côté de l audit', async () => {
    const monte = await monterDansUnCadre(
      ecranDuPupitre('A1-10-AUDIT-DIAPOSITIVE'),
      'projection',
      1280,
      720,
      ecranDuPupitre('A1-09-DIAPOSITIVE'),
    );
    await new Promise((suite) => setTimeout(suite, 50));
    const toile = monte.toile();
    const miniature = toile?.querySelector<HTMLElement>('[data-testid="cours-renvoi"]');
    const cadreMiniature = miniature?.getBoundingClientRect();
    const cadreDuRenvoi = miniature
      ?.querySelector<HTMLElement>('.cours-renvoi__cadre')
      ?.getBoundingClientRect();
    const toileDuRenvoi = miniature
      ?.querySelector<HTMLElement>('.cours-renvoi__toile')
      ?.getBoundingClientRect();
    const audit = monte.brique()?.shadowRoot?.querySelector('fieldset')?.getBoundingClientRect();
    const seChevauchent =
      cadreMiniature !== undefined &&
      audit !== undefined &&
      cadreMiniature.left < audit.right &&
      audit.left < cadreMiniature.right &&
      cadreMiniature.top < audit.bottom &&
      audit.top < cadreMiniature.bottom;

    expect(miniature?.textContent).toMatch(/Marge brute\s: une croissance continue/);
    expect(cadreMiniature?.width).toBeCloseTo(1280 * 0.6, 0);
    expect(toileDuRenvoi?.width).toBeLessThanOrEqual((cadreDuRenvoi?.width ?? 0) + 1);
    expect(toileDuRenvoi?.height).toBeLessThanOrEqual((cadreDuRenvoi?.height ?? 0) + 1);
    expect(seChevauchent).toBeFalse();
    expect(toile?.scrollHeight).toBeLessThanOrEqual(720);
    monte.detruire();
  });

  it(
    'QF-26 · met la diapositive commentée à la taille de son cadre en portrait, sans la rogner',
    async () => {
      const pupitre = ecransDuPupitreDe(INSTANTANE_B2_04);
      const releves = await constaterLesProjectionsARenvoi(pupitre, (ecran, monte) => {
        const toile = monte.hote.querySelector<HTMLElement>('.cours-renvoi__toile');
        const contenu = toile?.querySelector<HTMLElement>('app-slide-activity');
        if (!toile || !contenu) {
          return `${ecran.id} sans diapositive commentée`;
        }
        const echelle = toile.getBoundingClientRect().width / toile.offsetWidth;
        const rogne =
          contenu.scrollWidth > contenu.clientWidth + 1 ||
          contenu.offsetHeight > toile.clientHeight + 1;
        return `${ecran.renvoi ?? ''}:${echelle >= 0.8 ? 'lisible' : echelle.toFixed(2)}:${rogne ? 'rogne' : 'entier'}`;
      });

      expect(releves.filter((releve) => releve.endsWith(':rogne'))).toEqual([]);
      expect(releves.filter((releve) => releve.includes('HISTORIQUE'))).toEqual(
        Array.from({ length: 3 }, () => 'B2-04-A1-05-HISTORIQUE:lisible:entier'),
      );
    },
    DELAI_DE_MONTAGE_MS,
  );

  for (const { code, pupitre, publics } of COURS_A_RENVOIS) {
    it(
      `QF-27 · ne rogne en largeur aucun écran à renvoi du ${code} projeté : pas de défilement horizontal à la projection`,
      async () => {
        const rognes = await constaterLesProjectionsARenvoi(pupitre, ecranRogneEnLargeur);

        expect(rognes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );

    it(
      `QF-28 · au poste étudiant, ne rogne en largeur ni un écran à renvoi du ${code} ni sa diapositive commentée`,
      async () => {
        const rognes = await fautesDesEcrans(
          publics.filter(({ renvoi }) => renvoi !== undefined),
          pupitre,
          (ecran, renvoi) => monterDansUnCadre(ecran, 'etudiant', 1280, 720, renvoi),
          async (ecran, monte) => {
            await stabiliser(monte, 6);
            return ecranRogneEnLargeur(ecran, monte);
          },
        );

        expect(rognes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );

    it(
      `R3 · donne à chaque diapositive commentée du ${code} 60 % de la toile, et la fait remplir son cadre`,
      async () => {
        const fautes = await constaterLesProjectionsARenvoi(pupitre, (ecran, monte) => {
          if (monte.hote.classList.contains('cours-presentation--renvoi-masque')) {
            return null;
          }
          const miniature = monte
            .toile()
            ?.querySelector<HTMLElement>('[data-testid="cours-renvoi"]');
          const colonne = miniature?.getBoundingClientRect();
          const cadre = miniature?.querySelector('.cours-renvoi__cadre')?.getBoundingClientRect();
          const contenu = miniature
            ?.querySelector('.cours-renvoi__toile app-slide-activity')
            ?.getBoundingClientRect();
          const part = monte.hote.classList.contains('cours-presentation--renvoi-reduit') ? 40 : 60;
          const remplissage =
            cadre === undefined || contenu === undefined
              ? 0
              : Math.max(contenu.width / cadre.width, contenu.height / cadre.height);
          return Math.abs((colonne?.width ?? 0) - (1280 * part) / 100) > 1 ||
            remplissage < 0.9 ||
            remplissage > 1.01
            ? `${ecran.id} colonne=${colonne?.width} part=${part} remplissage=${remplissage.toFixed(2)}`
            : null;
        });

        expect(fautes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );
  }

  it('R7 · ne montre, à l écran des points, que la ligne du taux de marge du tableau de bord', async () => {
    const ecrans = ecransDuPupitreB2_01();
    const points = ecranDuPupitre('A2-06-POINTS');
    const monte = await monterDansUnCadre(
      points,
      'projection',
      1280,
      720,
      ecranDIdentifiant(ecrans, points.renvoi) ?? null,
    );
    await new Promise((suite) => setTimeout(suite, 50));
    const miniature = monte.toile()?.querySelector('[data-testid="cours-renvoi"]');
    const texte = [...(miniature?.querySelectorAll('*') ?? [])]
      .map((element) => element.shadowRoot?.textContent ?? '')
      .join(' ')
      .concat(miniature?.textContent ?? '');

    expect(texte).toContain('Taux de marge');
    expect(texte).not.toContain('CA HT total');
    expect(texte).not.toContain('Tableau de bord 2025 transmis au comité');
    monte.detruire();
  });

  it('R6 · SIMULATEUR-MIX : l aperçu formateur offre le même curseur, à la même place, que la projection', async () => {
    const curseurDe = async (mode: CoursPresentationMode) => {
      const monte = await monterDansUnCadre(ecranDuPupitre('A5-04-SIMULATEUR-MIX'), mode, 640, 360);
      const brique = monte.brique();
      const curseur = brique?.shadowRoot?.querySelector<HTMLInputElement>(
        '[data-testid="parametre"] input',
      );
      const toile = monte.toile()?.getBoundingClientRect();
      const rect = curseur?.getBoundingClientRect();
      const releve = {
        curseurs: brique === null ? undefined : noeudsOmbre(brique, 'parametre').length,
        reglable: curseur !== null && curseur !== undefined && !curseur.disabled,
        position:
          rect === undefined || toile === undefined
            ? null
            : [
                Math.round(((rect.left - toile.left) / toile.width) * 100),
                Math.round(((rect.top - toile.top) / toile.height) * 100),
              ],
      };
      monte.detruire();
      return releve;
    };

    const formateur = await curseurDe('formateur');

    expect(formateur.curseurs).toBe(1);
    expect(formateur.reglable).toBeTrue();
    expect(formateur).toEqual(await curseurDe('projection'));
  });

  for (const suffixe of ['A6-06-FICHE-MEMO', 'A6-07-BOITE-A-OUTILS']) {
    for (const mode of ['formateur', 'projection'] as const) {
      it(`R7 · ${suffixe} en ${mode} : chaque carte, recto puis verso, tient dans la toile`, async () => {
        const monte = await monterDansUnCadre(ecranDuPupitre(suffixe), mode, 1280, 720);
        const toile = monte.toile() as HTMLElement;
        const releve = (face: string) => ({
          face,
          toile: [toile.scrollWidth <= 1280, toile.scrollHeight <= 720],
          cartesQuiDebordent: cartesQuiDebordent(toile),
        });
        const recto = releve('recto');
        for (const carte of toile.querySelectorAll<HTMLElement>('.slide-grid__card--flip')) {
          carte.click();
        }
        await new Promise((suite) => setTimeout(suite, 300));

        expect([recto, releve('verso')]).toEqual([
          { face: 'recto', toile: [true, true], cartesQuiDebordent: [] },
          { face: 'verso', toile: [true, true], cartesQuiDebordent: [] },
        ]);
        monte.detruire();
      });
    }
  }

  for (const suffixe of [
    'A1-10-AUDIT-DIAPOSITIVE',
    'A1-11-JALON-1',
    'A2-02-ORIGINE-AXE',
    'A5-04-SIMULATEUR-MIX',
  ]) {
    it(`G2 · ${suffixe} : l aperçu formateur rend la même brique que la projection`, async () => {
      const releve = async (mode: CoursPresentationMode) => {
        const monte = await monterDansUnCadre(ecranDuPupitre(suffixe), mode, 640, 360);
        const brique = monte.brique();
        const rendu = {
          brique: brique?.tagName.toLowerCase(),
          role: brique?.getAttribute('data-cours-role'),
          rendu: brique?.shadowRoot?.innerHTML,
        };
        monte.detruire();
        return rendu;
      };

      const formateur = await releve('formateur');

      expect(formateur.role).toBe('presentateur');
      expect(formateur.rendu ?? '').not.toBe('');
      expect(formateur).toEqual(await releve('projection'));
    });
  }
});

function decrireLaTenueDuCours({ code, pupitre, publics }: (typeof COURS_MESURES)[number]): void {
  for (const mode of ['formateur', 'projection', 'etudiant'] as const) {
    it(
      `T2 · T3 · G01 · QP-04 · QP-02 · chaque écran du ${code} tient sur une toile 1280 × 720 en ${mode}, sans défilement interne ni tassement, sa police mono sans ligature, et aucun libellé collé à son voisin avant comme après révélation`,
      async () => {
        const ecrans = mode === 'etudiant' ? publics : pupitre;
        const fautes = await fautesDesEcrans(
          ecrans,
          pupitre,
          (ecran, renvoi) => monterDansUnCadre(ecran, mode, 1280, 720, renvoi),
          async (ecran, monte) => {
            const toile = monte.toile();
            const horsToile = elementsPerdus(monte);
            const defileurs = toile === null ? [] : defileursInternes(toile);
            const echelle = echelleDuContenu(toile);
            const ligatures = toile === null ? [] : monoAvecLigatures(toile);
            const colles = await libellesCollesAvantEtApresRevelation(monte);
            return horsToile.length > 0 ||
              defileurs.length > 0 ||
              echelle < ECHELLE_MINIMALE ||
              ligatures.length > 0 ||
              colles.length > 0
              ? `${ecran.id} ${mode} hors=${horsToile.join(',')} defile=${defileurs.join(',')} echelle=${echelle} ligatures=${ligatures.join(',')} colles=${colles.join(',')}`
              : null;
          },
        );

        expect(pupitre.length).withContext(`écrans du ${code}`).toBeGreaterThan(0);
        expect(ecrans.map(({ id }) => id))
          .withContext(`écrans du ${code} mesurés en ${mode}`)
          .toEqual(pupitre.map(({ id }) => id));
        expect(fautes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );
  }

  itSansEcranFautif(
    `G01 · QP-02 · sur un portable 14 pouces, chaque écran étudiant du ${code} tient dans son cadre sans défiler, à une taille lisible, sans libellé collé à son voisin avant comme après révélation`,
    publics,
    pupitre,
    (ecran, renvoi) =>
      monterDansUnCadre(
        ecran,
        'etudiant',
        CADRE_ETUDIANT_14_POUCES.largeur,
        CADRE_ETUDIANT_14_POUCES.hauteur,
        renvoi,
      ),
    async (_ecran, monte) => {
      const echelle = echelleAffichee(monte);
      return [
        ...(monte.cadre.scrollHeight > monte.cadre.clientHeight + 1 ? ['defile'] : []),
        ...elementsHorsToile(monte).map((element) => `hors=${element}`),
        ...(echelle < ECHELLE_MINIMALE - 0.001 ? [`echelle=${echelle.toFixed(3)}`] : []),
        ...(await libellesCollesAvantEtApresRevelation(monte)),
      ];
    },
  );

  itSansEcranFautif(
    `QP-02 · sur un téléphone, aucun libellé d un écran étudiant du ${code} ne touche ni ne chevauche son voisin, avant comme après révélation`,
    publics,
    pupitre,
    monterAuTelephone,
    (_ecran, monte) => libellesCollesAvantEtApresRevelation(monte),
  );
}

function cartesQuiDebordent(racine: ParentNode): string[] {
  return [...racine.querySelectorAll<HTMLElement>('.slide-grid__card')]
    .filter((carte) => {
      const cadre = carte.getBoundingClientRect();
      return (
        carte.scrollHeight > carte.clientHeight + 1 ||
        carte.scrollWidth > carte.clientWidth + 1 ||
        [...carte.querySelectorAll<HTMLElement>('h3, p, strong, span')].some((texte) => {
          const bloc = texte.getBoundingClientRect();
          return (
            bloc.width > 0 &&
            getComputedStyle(texte).visibility === 'visible' &&
            (bloc.right > cadre.right + 1 ||
              bloc.bottom > cadre.bottom + 1 ||
              bloc.left < cadre.left - 1 ||
              bloc.top < cadre.top - 1)
          );
        })
      );
    })
    .map((carte) => carte.querySelector('h3, strong')?.textContent?.trim() ?? '?');
}

function elementsDebordantLaToile(
  monte: EcranCadre,
  deborde: (element: HTMLElement, bloc: DOMRect, toile: DOMRect) => boolean,
): HTMLElement[] | null {
  const toile = monte.toile()?.getBoundingClientRect();
  const contenu = monte.toile()?.querySelector('[data-testid="cours-contenu"]');
  if (toile === undefined || contenu === null || contenu === undefined) {
    return null;
  }
  return elementsDe(contenu).filter((element) =>
    deborde(element, element.getBoundingClientRect(), toile),
  );
}

function affiche(element: HTMLElement): boolean {
  const replie = element.parentElement?.closest('details:not([open])');
  const resume = element.tagName === 'SUMMARY' && element.parentElement === replie;
  return (
    (replie === null || replie === undefined || resume) &&
    getComputedStyle(element).visibility === 'visible'
  );
}

function elementsHorsToile(monte: EcranCadre): string[] {
  const horsToile = elementsDebordantLaToile(
    monte,
    (element, bloc, toile) =>
      bloc.height > 0 &&
      affiche(element) &&
      (bloc.top < toile.top - 1 || bloc.bottom > toile.bottom + 1),
  );
  return horsToile?.map(({ tagName }) => tagName) ?? ['toile absente'];
}

function elementsHorsToileEnLargeur(
  monte: EcranCadre,
  { saufDansUnDefileur = false } = {},
): string[] {
  const horsToile = elementsDebordantLaToile(
    monte,
    (element, bloc, toile) =>
      !(saufDansUnDefileur && element.closest('.defileur-de-tableau > *') !== null) &&
      bloc.width > 0 &&
      element.checkVisibility() &&
      (bloc.left < toile.left - 1 || bloc.right > toile.right + 1),
  );
  return (
    horsToile?.map(
      (element) =>
        `${element.tagName.toLowerCase()}:${element.textContent?.trim().slice(0, 20) ?? ''}`,
    ) ?? ['toile absente']
  );
}

const ECHELLE_MINIMALE = 0.8;

const ECRAN_TROP_LONG = 'A2-07-JEU-COMPARABLE';

const CADRE_ETUDIANT_14_POUCES = { largeur: 1480, hauteur: 913 } as const;

const CADRE_TELEPHONE = { largeur: 390, hauteur: 844 } as const;

const CADRE_ETUDIANT_1920 = { largeur: 1888, hauteur: 960 } as const;

const CADRE_ETUDIANT_1366 = { largeur: 1334, hauteur: 648 } as const;

async function libellesCollesAvantEtApresRevelation(
  monte: EcranCadre,
  juger: (racine: HTMLElement) => readonly string[] = libellesColles,
): Promise<string[]> {
  await stabiliser(monte, 1);
  const avant = juger(monte.hote).map((jonction) => `avant ${jonction}`);
  await monte.piloter(PILOTAGE_REVELE);
  await stabiliser(monte, 3);
  return [...avant, ...juger(monte.hote).map((jonction) => `révélé ${jonction}`)];
}

function libellesOuValeursSurUneForme(racine: HTMLElement): readonly string[] {
  return [...libellesColles(racine), ...valeursSurUneForme(racine)];
}

function echelleAffichee(monte: EcranCadre): number {
  const toile = monte.toile();
  const largeur = toile?.getBoundingClientRect().width ?? 0;
  return (largeur / 1280) * echelleDuContenu(toile);
}

function defilante(monte: EcranCadre): boolean {
  return monte.hote.classList.contains('cours-presentation--defilante');
}

function elementsPerdus(monte: EcranCadre): string[] {
  return defilante(monte) ? elementsHorsDeLaPage(monte) : elementsHorsToile(monte);
}

function elementsHorsDeLaPage(monte: EcranCadre): string[] {
  const cadre = monte.cadre.getBoundingClientRect();
  const fond = cadre.top - monte.cadre.scrollTop + monte.cadre.scrollHeight;
  const contenu = monte.toile()?.querySelector('[data-testid="cours-contenu"]');
  return contenu === null || contenu === undefined
    ? ['toile absente']
    : elementsDe(contenu)
        .filter((element) => {
          const bloc = element.getBoundingClientRect();
          return (
            bloc.height > 0 &&
            affiche(element) &&
            (bloc.bottom > fond + 1 || bloc.right > cadre.right + 1 || bloc.left < cadre.left - 1)
          );
        })
        .map(({ tagName }) => tagName);
}

function echelleDuContenu(toile: HTMLElement | null): number {
  const contenu = toile?.querySelector<HTMLElement>('.cours-toile__contenu');
  if (contenu === null || contenu === undefined) {
    return 1;
  }
  const { transform } = getComputedStyle(contenu);
  return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;
}

function elementsDe(racine: ParentNode): HTMLElement[] {
  return [...racine.querySelectorAll<HTMLElement>('*')].flatMap((element) => [
    element,
    ...(element.shadowRoot === null ? [] : elementsDe(element.shadowRoot)),
  ]);
}

function monoAvecLigatures(racine: ParentNode): string[] {
  return [
    ...new Set(
      elementsDe(racine)
        .filter((element) => {
          const style = getComputedStyle(element);
          return (
            style.fontFamily.startsWith('"Geist Mono"') && style.fontVariantLigatures !== 'none'
          );
        })
        .map((element) => `${element.tagName.toLowerCase()}.${element.classList.item(0) ?? ''}`),
    ),
  ];
}

function defileursQuiDebordent(racine: ParentNode, axe: 'x' | 'y'): string[] {
  return elementsDe(racine)
    .filter((element) => {
      const style = getComputedStyle(element);
      const defilement = axe === 'x' ? style.overflowX : style.overflowY;
      const deborde =
        axe === 'x'
          ? element.scrollWidth > element.clientWidth + 1
          : element.scrollHeight > element.clientHeight + 1;
      return (
        (defilement === 'auto' || defilement === 'scroll') && deborde && element.checkVisibility()
      );
    })
    .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
}

function defileursInternes(racine: ParentNode): string[] {
  return defileursQuiDebordent(racine, 'y');
}

function defileursRognes(racine: ParentNode): string[] {
  return defileursQuiDebordent(racine, 'x');
}

function ecranRogneEnLargeur(ecran: EcranContent, monte: EcranCadre): string | null {
  const defileurs = [
    monte.hote.querySelector('[data-testid="cours-contenu"]'),
    monte.hote.querySelector('.cours-renvoi__toile'),
  ].flatMap((zone) => (zone === null ? [] : defileursRognes(zone)));
  return defileurs.length > 0 ? `${ecran.id} (${defileurs.join(',')})` : null;
}

const TRACE_MINIMAL_REM = 12;

function tracesTropBas(racine: ParentNode): string[] {
  const minimum =
    TRACE_MINIMAL_REM * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return [...racine.querySelectorAll<HTMLElement>('.slide-chart__zone')]
    .filter((zone) => zone.checkVisibility() && zone.offsetHeight < minimum - 0.5)
    .map((zone) => `tracé de ${zone.offsetHeight} px`);
}

const POSTES_DES_GRAPHIQUES = [
  {
    poste: 'projection 1280 × 720',
    ecransDe: ecransDuPupitreDe,
    monter: (ecran: EcranContent, renvoi: EcranContent | null) =>
      monterDansUnCadre(ecran, 'projection', 1280, 720, renvoi),
  },
  {
    poste: 'pupitre 1280 × 720',
    ecransDe: ecransDuPupitreDe,
    monter: (ecran: EcranContent, renvoi: EcranContent | null) =>
      monterDansUnCadre(ecran, 'formateur', 1280, 720, renvoi),
  },
  {
    poste: 'portable 14 pouces',
    ecransDe: ecransPublicsDe,
    monter: (ecran: EcranContent, renvoi: EcranContent | null) =>
      monterDansUnCadre(
        ecran,
        'etudiant',
        CADRE_ETUDIANT_14_POUCES.largeur,
        CADRE_ETUDIANT_14_POUCES.hauteur,
        renvoi,
      ),
  },
  { poste: 'téléphone', ecransDe: ecransPublicsDe, monter: monterAuTelephone },
] as const;

describe('QP-02 · QP-18 · QP-21 · graphiques des cours servis, aucun libellé qui en touche un autre, aucune valeur sur une forme qui n est pas la sienne, un tracé d au moins 12 rem', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));
  jouerLesGraphiquesJusquAuBout();

  for (const { code, instantane, pupitre, publics } of COURS_MESURES) {
    const montreUnGraphique = (ecran: EcranContent): boolean =>
      [ecran, ecranDIdentifiant(pupitre, ecran.renvoi)].some(
        (montre) => montre !== undefined && presentationDe(montre)?.renderer === 'chart',
      );
    for (const { poste, ecransDe, monter } of POSTES_DES_GRAPHIQUES) {
      const graphiques = ecransDe(instantane).filter(montreUnGraphique);
      if (graphiques.length > 0) {
        itSansEcranFautif(
          `${code} · ${poste} : aucun libellé d un graphique ne touche ni ne chevauche son voisin, aucune valeur ne touche une barre, un marqueur ou un point qui n est pas le sien, avant comme après révélation, et chaque tracé mesure au moins 12 rem`,
          graphiques,
          pupitre,
          monter,
          async (_ecran, monte) => [
            ...(await libellesCollesAvantEtApresRevelation(monte, libellesOuValeursSurUneForme)),
            ...(poste === 'téléphone'
              ? []
              : [...monte.hote.querySelectorAll('.slide-chart__defileur')].flatMap((zone) =>
                  zone.scrollWidth > zone.clientWidth + 1 ? ['le graphique glisse'] : [],
                )),
            ...tracesTropBas(monte.hote),
          ],
        );
      }
    }

    const graphiquesPropres = publics.filter(
      (ecran) => presentationDe(ecran)?.renderer === 'chart',
    );
    if (graphiquesPropres.length > 0) {
      itSansEcranFautif(
        `QP-18 · ${code} · téléphone : un graphique trop serré glisse en largeur comme un tableau, chaque valeur écrite, l axe des valeurs toujours en vue`,
        graphiquesPropres,
        pupitre,
        monterAuTelephone,
        async (_ecran, monte) => {
          await stabiliser(monte, 3);
          return [...monte.hote.querySelectorAll('.cours-toile__principal .slide-chart')].flatMap(
            valeursTaiesOuAxePerdu,
          );
        },
      );
    }
  }
});

describe('QP-20 · au téléphone, l écran rappelé se lit comme lui-même, plus aucune miniature', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));
  jouerLesGraphiquesJusquAuBout();

  for (const { code, pupitre, publics } of COURS_A_RENVOIS) {
    const aRenvoi = publics.filter(({ renvoi }) => renvoi !== undefined);
    if (aRenvoi.length > 0) {
      itSansEcranFautif(
        `QP-20 · ${code} · au téléphone, chaque écran rappelé s affiche en pleine largeur, à une taille d au moins 0,8, au-dessus de la question`,
        aRenvoi,
        pupitre,
        monterAuTelephone,
        async (_ecran, monte) => {
          await stabiliser(monte, 3);
          return renvoiIllisibleOuMalPlace(monte);
        },
      );
    }
  }
});

function renvoiIllisibleOuMalPlace(monte: EcranCadre): string[] {
  const toile = monte.hote.querySelector<HTMLElement>('.cours-renvoi__toile');
  const contenu = monte.hote.querySelector<HTMLElement>('[data-testid="cours-contenu"]');
  if (toile === null || contenu === null) {
    return ['écran rappelé absent'];
  }
  const renvoi = toile.getBoundingClientRect();
  const question = contenu.getBoundingClientRect();
  const echelle = renvoi.width / Math.max(1, toile.offsetWidth);
  const bas = Math.max(
    renvoi.bottom,
    ...elementsDe(toile)
      .filter((element) => element.checkVisibility())
      .map((element) => element.getBoundingClientRect().bottom),
  );
  return [
    ...(echelle < ECHELLE_MINIMALE ? [`taille ${echelle.toFixed(2)}`] : []),
    ...(Math.abs(renvoi.width - question.width) > 1
      ? [`largeur ${renvoi.width.toFixed(0)} sur ${question.width.toFixed(0)}`]
      : []),
    ...(bas > question.top + 1 ? ['pas au-dessus de la question'] : []),
  ];
}

function valeursTaiesOuAxePerdu(graphique: Element): string[] {
  const taies = [...graphique.querySelectorAll('.slide-chart__value, .slide-chart__point-value')]
    .filter((valeur) => getComputedStyle(valeur).visibility !== 'visible')
    .map((valeur) => `masquée ${valeur.textContent?.trim() ?? ''}`);
  const axe = graphique.querySelector('.slide-chart__axis--left');
  const defileur = elementsDe(graphique).find((element) => {
    const { overflowX } = getComputedStyle(element);
    return (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      element.scrollWidth > element.clientWidth + 1
    );
  });
  if (defileur === undefined || axe === null) {
    return taies;
  }
  defileur.scrollLeft = defileur.scrollWidth;
  const vue = defileur.getBoundingClientRect();
  const bord = axe.getBoundingClientRect();
  const perdu = bord.left < vue.left - 1 || bord.right > vue.right + 1;
  defileur.scrollLeft = 0;
  return [
    ...taies,
    ...(defileur.classList.contains('defileur-de-tableau') ? [] : [`défile hors défileur`]),
    ...(perdu ? ['axe perdu au bout du tracé'] : []),
  ];
}

const TYPES_A_TABLEAU: ReadonlySet<string> = new Set([
  'fp-sheet',
  'fp-table-build',
  'fp-plot',
  'fp-concept4',
  'fp-spaced',
  'fp-cardsort',
]);
const RENDUS_A_TABLEAU: ReadonlySet<string> = new Set(['table', 'chart', 'boxplot', 'scatter']);

function peutMontrerUnTableau(ecran: EcranContent): boolean {
  return (
    TYPES_A_TABLEAU.has(ecran.type) || RENDUS_A_TABLEAU.has(presentationDe(ecran)?.renderer ?? '')
  );
}

const POSTES_DES_TABLEAUX = [
  {
    poste: 'ordinateur 1920 × 1080',
    entier: true,
    lisible: true,
    graphiqueQuiGlisse: false,
    monter: (ecran: EcranContent, renvoi: EcranContent | null) =>
      monterDansUnCadre(
        ecran,
        'etudiant',
        CADRE_ETUDIANT_1920.largeur,
        CADRE_ETUDIANT_1920.hauteur,
        renvoi,
      ),
  },
  {
    poste: 'portable 1366 × 768',
    entier: false,
    lisible: true,
    graphiqueQuiGlisse: false,
    monter: (ecran: EcranContent, renvoi: EcranContent | null) =>
      monterDansUnCadre(
        ecran,
        'etudiant',
        CADRE_ETUDIANT_1366.largeur,
        CADRE_ETUDIANT_1366.hauteur,
        renvoi,
      ),
  },
  {
    poste: 'téléphone 390 × 844',
    entier: false,
    lisible: false,
    graphiqueQuiGlisse: true,
    monter: monterAuTelephone,
  },
] as const;

function contenuMonte(monte: EcranCadre): HTMLElement | null {
  return monte.hote.querySelector<HTMLElement>('[data-testid="cours-contenu"]');
}

async function tableauxDepliesDe(monte: EcranCadre): Promise<HTMLTableElement[]> {
  const contenu = contenuMonte(monte);
  const elements = contenu === null ? [] : elementsDe(contenu);
  const replies = elements.filter(
    (element): element is HTMLDetailsElement => element instanceof HTMLDetailsElement,
  );
  replies.forEach((details) => {
    details.open = true;
  });
  await stabiliser(monte, replies.length > 0 ? 4 : 1);
  return elements.filter(
    (element): element is HTMLTableElement =>
      element instanceof HTMLTableElement && element.checkVisibility(),
  );
}

function nomDuDefileur(defileur: HTMLElement): string {
  return `${defileur.tagName.toLowerCase()}.${defileur.classList.item(0) ?? ''}`;
}

function horsDeLaCarteEnLargeur(monte: EcranCadre): string[] {
  return elementsHorsToileEnLargeur(monte, { saufDansUnDefileur: true }).map(
    (faute) => `hors carte ${faute}`,
  );
}

function motsCoupes(monte: EcranCadre): string[] {
  const contenu = contenuMonte(monte);
  if (contenu === null) return ['contenu absent'];
  const plage = document.createRange();
  return elementsDe(contenu)
    .flatMap((element) => [...element.childNodes])
    .filter((noeud): noeud is Text => {
      if (!(noeud instanceof Text)) return false;
      plage.selectNodeContents(noeud);
      return lignesDe(plage) > 1;
    })
    .filter(
      ({ parentElement: parent }) =>
        parent !== null &&
        parent.closest('svg, option') === null &&
        !getComputedStyle(parent).fontFamily.startsWith('"Geist Mono"'),
    )
    .flatMap((noeud) => {
      const texte = noeud.textContent ?? '';
      const lettrine =
        noeud.parentElement?.firstChild === noeud &&
        getComputedStyle(noeud.parentElement, '::first-letter').float !== 'none'
          ? texte.search(/\p{L}/u)
          : -1;
      return [...texte.matchAll(/\S+/gu)]
        .filter(({ 0: jeton }) => !/[=();!$:"[\]]/u.test(jeton))
        .flatMap(({ 0: jeton, index: debut }) =>
          [...jeton.matchAll(/\p{L}{2,}/gu)].map(({ 0: mot, index }) => ({
            mot,
            index: debut + index,
          })),
        )
        .filter(({ mot, index }) => {
          const apresLaLettrine = index === lettrine ? 1 : 0;
          plage.setStart(noeud, index + apresLaLettrine);
          plage.setEnd(noeud, index + mot.length);
          return lignesDe(plage) > 1;
        })
        .map(
          ({ mot }) =>
            `mot coupé ${mot} dans ${noeud.parentElement?.tagName.toLowerCase()}.${noeud.parentElement?.classList.item(0) ?? ''}`,
        );
    });
}

async function fautesDuDefileur(monte: EcranCadre, defileur: HTMLElement): Promise<string[]> {
  const nom = nomDuDefileur(defileur);
  const ombre = (): string => getComputedStyle(defileur, '::after').opacity;
  const fautes: string[] = [];
  if (
    !defileur.hasAttribute('data-suite-apres') ||
    defileur.hasAttribute('data-suite-avant') ||
    ombre() !== '1'
  ) {
    fautes.push(`${nom} sans ombre de suite au départ`);
  }
  defileur.scrollLeft = defileur.scrollWidth;
  await stabiliser(monte, 2);
  const bord = defileur.getBoundingClientRect();
  if (
    !defileur.hasAttribute('data-suite-avant') ||
    defileur.hasAttribute('data-suite-apres') ||
    ombre() !== '0'
  ) {
    fautes.push(`${nom} suite mal signalée au bout`);
  }
  const enTetes = [
    ...defileur.querySelectorAll<HTMLElement>(
      ':scope > table > * > tr > :first-child, [data-colonne-fixe]',
    ),
  ];
  const decroches = enTetes.filter(
    (cellule) => Math.abs(cellule.getBoundingClientRect().left - bord.left) > 1,
  );
  if (enTetes.length === 0 || decroches.length > 0) {
    fautes.push(`${nom} en-têtes de ligne non figés (${decroches.length}/${enTetes.length})`);
  }
  const legende = defileur.querySelector(':scope > table > caption')?.getBoundingClientRect();
  if (legende !== undefined && (legende.left < bord.left - 1 || legende.right > bord.right + 1)) {
    fautes.push(`${nom} légende hors de vue au bout`);
  }
  defileur.scrollLeft = 0;
  await stabiliser(monte, 1);
  return fautes;
}

async function fautesDesTableauxLarges(
  monte: EcranCadre,
  tableaux: readonly HTMLTableElement[],
  entier: boolean,
  lisible: boolean,
  graphiqueQuiGlisse: boolean,
): Promise<string[]> {
  const contenu = contenuMonte(monte);
  if (contenu === null) {
    return ['contenu absent'];
  }
  const fautes = tableaux
    .filter((tableau) => tableau.parentElement?.classList.contains('defileur-de-tableau') !== true)
    .map((tableau) => `${nomDuDefileur(tableau)} hors du défileur des tableaux`);
  const defileurs = elementsDe(contenu).filter(
    (element) =>
      ['auto', 'scroll'].includes(getComputedStyle(element).overflowX) &&
      element.scrollWidth > element.clientWidth + 1 &&
      element.checkVisibility(),
  );
  const echelleDeLaToile = (monte.toile()?.getBoundingClientRect().width ?? 0) / 1280;
  const reductionMinimale = ECHELLE_MINIMALE / Math.max(1, echelleDeLaToile);
  const elargissement = Number.parseFloat(contenu.style.inlineSize || '100') / 100;
  for (const defileur of defileurs) {
    if (entier) {
      fautes.push(`${nomDuDefileur(defileur)} défile au lieu de tenir entier`);
    } else if (!defileur.classList.contains('defileur-de-tableau')) {
      fautes.push(`${nomDuDefileur(defileur)} défile hors d un tableau`);
    } else if (defileur.classList.contains('slide-chart__defileur') && !graphiqueQuiGlisse) {
      fautes.push(`${nomDuDefileur(defileur)} graphique qui glisse hors du téléphone`);
    } else {
      if (lisible && elargissement < 1 / reductionMinimale - 0.01) {
        fautes.push(
          `${nomDuDefileur(defileur)} défile sur une carte élargie à ${elargissement.toFixed(2)} seulement`,
        );
      }
      fautes.push(...(await fautesDuDefileur(monte, defileur)));
    }
  }
  const reduction = echelleDuContenu(monte.toile());
  if (lisible && reduction < reductionMinimale - 0.001) {
    fautes.push(`réduction ${reduction.toFixed(3)} sous ${reductionMinimale.toFixed(3)}`);
  }
  return [...fautes, ...horsDeLaCarteEnLargeur(monte)];
}

describe('QP-03 · tenue des tableaux larges en mode étudiant, sur tous les cours servis, à 1920, 1366 et 390', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  for (const { code, pupitre, publics } of COURS_MESURES) {
    const aTableau = publics.filter(peutMontrerUnTableau);

    it(
      `QP-03 · ${code} · au poste étudiant, chaque tableau montré est dans le défileur des tableaux, sur un écran retenu par ce test`,
      async () => {
        const fautes = await fautesDesEcrans(
          publics,
          pupitre,
          monterAuTelephone,
          async (ecran, monte) => {
            const tableaux = await tableauxDepliesDe(monte);
            const hors = tableaux.filter(
              (tableau) =>
                tableau.parentElement?.classList.contains('defileur-de-tableau') !== true,
            );
            const nonRetenu = tableaux.length > 0 && !peutMontrerUnTableau(ecran);
            return hors.length > 0 || nonRetenu
              ? `${ecran.id} hors du défileur=${hors.length} non retenu=${String(nonRetenu)}`
              : null;
          },
        );

        expect(fautes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );

    for (const { poste, entier, lisible, graphiqueQuiGlisse, monter } of POSTES_DES_TABLEAUX) {
      it(
        `QP-03 · ${code} · ${poste} : ${entier ? 'chaque tableau tient entier, à une taille lisible' : 'seul un tableau plus large que la carte défile, avec l ombre de la suite et ses en-têtes de ligne figés'}`,
        async () => {
          const fautes = await fautesDesEcrans(aTableau, pupitre, monter, async (ecran, monte) => {
            const tableaux = await tableauxDepliesDe(monte);
            if (tableaux.length === 0) {
              return null;
            }
            const faute = await fautesDesTableauxLarges(
              monte,
              tableaux,
              entier,
              lisible,
              graphiqueQuiGlisse,
            );
            return faute.length > 0 ? `${ecran.id} ${faute.join(' ; ')}` : null;
          });

          expect(fautes).toEqual([]);
        },
        DELAI_DE_MONTAGE_MS,
      );
    }
  }
});

async function choisirLesOptionsLesPlusLongues(monte: EcranCadre): Promise<void> {
  const contenu = contenuMonte(monte);
  const options = (contenu === null ? [] : elementsDe(contenu)).filter(
    (element): element is HTMLInputElement =>
      element instanceof HTMLInputElement &&
      ['radio', 'checkbox'].includes(element.type) &&
      !element.disabled &&
      element.checkVisibility(),
  );
  const libelle = (option: HTMLInputElement): number =>
    option.closest('label')?.textContent?.trim().length ?? 0;
  const racines: Node[] = [];
  const groupes = new Map<string, HTMLInputElement[]>();
  options.forEach((option, rang) => {
    const racine = option.getRootNode();
    if (!racines.includes(racine)) {
      racines.push(racine);
    }
    const cle =
      option.type === 'radio' ? `${racines.indexOf(racine)}:${option.name}` : `case:${rang}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), option]);
  });
  for (const groupe of groupes.values()) {
    groupe
      .reduce(
        (retenue, option) => (libelle(option) > libelle(retenue) ? option : retenue),
        groupe[0],
      )
      .click();
  }
  await stabiliser(monte, options.length > 0 ? 2 : 0);
}

describe('QP-08 · aucune brique révélée ne dépasse sa colonne à 390, sur tous les cours servis', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  for (const { code, pupitre, publics } of COURS_MESURES) {
    it(
      `QP-08 · ${code} · au téléphone, rien ne dépasse la carte et aucun mot n'est coupé : écran servi, option la plus longue choisie, puis corrigé révélé`,
      async () => {
        const constater = (monte: EcranCadre): string[] => [
          ...horsDeLaCarteEnLargeur(monte),
          ...motsCoupes(monte),
        ];
        const fautes = await fautesDesEcrans(
          publics,
          pupitre,
          monterAuTelephone,
          async (ecran, monte) => {
            await stabiliser(monte, 1);
            const servi = constater(monte);
            await choisirLesOptionsLesPlusLongues(monte);
            const choisi = constater(monte);
            await monte.afficher(ecranReveleAuPosteEtudiant(ecran, pupitre));
            await monte.piloter(PILOTAGE_REVELE);
            await stabiliser(monte, 3);
            const revele = constater(monte);
            const etapes = [
              ['servi', servi],
              ['choisi', choisi],
              ['révélé', revele],
            ] as const;
            const constats = etapes
              .filter(([, hors]) => hors.length > 0)
              .map(([etape, hors]) => `${etape} : ${hors.join(' ; ')}`);
            return constats.length > 0 ? `${ecran.id} ${constats.join(' | ')}` : null;
          },
        );

        expect(fautes).toEqual([]);
      },
      DELAI_DE_MONTAGE_MS,
    );
  }
});

const REPONSE_DE_500_CARACTERES = 'La marge baisse car le coût d’achat augmente plus vite. '
  .repeat(10)
  .slice(0, 500);

function zonesDeSaisie(monte: EcranCadre): HTMLTextAreaElement[] {
  const contenu = contenuMonte(monte);
  return (contenu === null ? [] : elementsDe(contenu)).filter(
    (element): element is HTMLTextAreaElement =>
      element instanceof HTMLTextAreaElement &&
      !element.disabled &&
      !element.readOnly &&
      element.checkVisibility(),
  );
}

const PAIRES_D_IMAGES_POUR_QUE_LA_SAISIE_SE_POSE = 10;

function constaterLesZonesDeSaisie(monte: EcranCadre): {
  readonly zones: number;
  readonly fautes: string[];
} {
  const relues = zonesDeSaisie(monte);
  return {
    zones: relues.length,
    fautes: relues.flatMap((zone) => {
      const nom = `${zone.tagName.toLowerCase()}.${zone.classList.item(0) ?? ''}`;
      if (zone.value !== REPONSE_DE_500_CARACTERES) {
        return [`${nom} réponse tronquée à ${zone.value.length}`];
      }
      return zone.scrollHeight > zone.clientHeight + 1
        ? [`${nom} défile en interne (${zone.scrollHeight}/${zone.clientHeight})`]
        : [];
    }),
  };
}

async function fautesDesZonesDeSaisie(monte: EcranCadre): Promise<{
  readonly zones: number;
  readonly fautes: string[];
}> {
  const saisies = zonesDeSaisie(monte);
  for (const zone of saisies) {
    zone.value = REPONSE_DE_500_CARACTERES;
    zone.dispatchEvent(new Event('input', { bubbles: true }));
  }
  await stabiliser(monte, saisies.length > 0 ? 2 : 0);
  let constat = constaterLesZonesDeSaisie(monte);
  for (
    let paire = 0;
    paire < PAIRES_D_IMAGES_POUR_QUE_LA_SAISIE_SE_POSE && constat.fautes.length > 0;
    paire += 1
  ) {
    await deuxImages();
    constat = constaterLesZonesDeSaisie(monte);
  }
  return constat;
}

describe('QP-09 · une zone de saisie grandit avec une réponse de 500 caractères, sur tous les cours servis', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  for (const { code, pupitre, publics } of COURS_MESURES) {
    for (const { poste, monter } of [POSTES_DES_TABLEAUX[0], POSTES_DES_TABLEAUX[2]]) {
      it(
        `QP-09 · ${code} · ${poste} : chaque zone de saisie montre toute une réponse de 500 caractères, sans défiler`,
        async () => {
          let zones = 0;
          const fautes = await fautesDesEcrans(publics, pupitre, monter, async (ecran, monte) => {
            await stabiliser(monte, 1);
            const constat = await fautesDesZonesDeSaisie(monte);
            zones += constat.zones;
            return constat.fautes.length > 0 ? `${ecran.id} ${constat.fautes.join(' ; ')}` : null;
          });

          expect(zones).toBeGreaterThan(0);
          expect(fautes).toEqual([]);
        },
        DELAI_DE_MONTAGE_MS,
      );
    }
  }
});

describe('CoursPresentationComponent au poste étudiant', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  async function monterAuPosteEtudiant(
    suffixe: string,
    largeur: number,
    pret: (racine: HTMLElement) => boolean,
  ): Promise<{ fixture: ComponentFixture<CoursPresentationComponent>; racine: HTMLElement }> {
    const ecran = ecransPublicsB2_01().find(({ id }) => id.endsWith(suffixe));
    expect(ecran).withContext(suffixe).toBeDefined();
    const poste = document.createElement('section');
    poste.className = 'student-session';
    poste.style.cssText = `display:block;width:${largeur}px;`;
    document.body.appendChild(poste);
    const fixture = TestBed.createComponent(CoursPresentationComponent);
    poste.appendChild(fixture.nativeElement as HTMLElement);
    fixture.componentRef.onDestroy(() => poste.remove());
    fixture.componentRef.setInput('mode', 'etudiant');
    fixture.componentRef.setInput('slide', ecran ?? null);
    const racine = fixture.nativeElement as HTMLElement;
    await attendreQue(fixture, () => pret(racine), `${suffixe} au poste étudiant`);
    return { fixture, racine };
  }

  const monterLeCoffreSurUnTelephone = (): ReturnType<typeof monterAuPosteEtudiant> =>
    monterAuPosteEtudiant(
      'A6-02-COFFRE',
      390,
      (element) =>
        element.querySelector('app-slide-activity [data-cours-role]')?.shadowRoot?.firstChild !=
        null,
    );

  it('R5 · COFFRE : la page défile, aucun bloc ne défile en interne', async () => {
    const { fixture, racine } = await monterLeCoffreSurUnTelephone();
    await new Promise((suite) => setTimeout(suite, 50));

    expect(defileursInternes(racine)).toEqual([]);
    fixture.destroy();
  });

  it('QF-13 · sur un téléphone, la colonne de l écran prend la hauteur de son contenu au lieu de le rogner', async () => {
    const { fixture, racine } = await monterLeCoffreSurUnTelephone();
    await attendreQue(
      fixture,
      () => racine.classList.contains('cours-presentation--compacte'),
      'le passage en disposition compacte',
    );
    const principal = racine.querySelector<HTMLElement>('.cours-toile__principal');
    const contenu = racine.querySelector<HTMLElement>('[data-testid="cours-contenu"]');

    expect(contenu?.offsetHeight).toBeGreaterThan(100);
    expect(principal?.clientHeight).toBeGreaterThanOrEqual(contenu?.offsetHeight ?? Infinity);
    fixture.destroy();
  });

  for (const largeur of [390, 1280]) {
    it(`R7 · BOITE-A-OUTILS à ${largeur} px : chaque carte, recto puis verso, tient dans son contenant`, async () => {
      const { fixture, racine } = await monterAuPosteEtudiant(
        'A6-07-BOITE-A-OUTILS',
        largeur,
        (element) => element.querySelector('.slide-grid__card') !== null,
      );
      const recto = cartesQuiDebordent(racine);
      for (const carte of racine.querySelectorAll<HTMLElement>('.slide-grid__card--flip')) {
        carte.click();
      }
      fixture.detectChanges();
      await new Promise((suite) => setTimeout(suite, 300));

      expect({ recto, verso: cartesQuiDebordent(racine) }).toEqual({ recto: [], verso: [] });
      fixture.destroy();
    });
  }
});

const PIECE_JOINTE: PieceJointe = {
  libelle: 'Export des ventes Norvane (classeur Excel)',
  fichier: '/assets/cours/b3-01/B3-01_export_ventes.dfa709a7.xlsx',
};

const MODES = ['etudiant', 'formateur', 'projection'] as const;

function ecranDuMode(mode: CoursPresentationMode, pieceJointe?: PieceJointe): EcranContent {
  const ecran = ecranB2_01Du(mode, 'A1-09-DIAPOSITIVE');
  return pieceJointe === undefined ? ecran : { ...ecran, pieceJointe };
}

function pieceJointeAffichee(monte: EcranCadre): HTMLElement | null {
  return monte.hote.querySelector<HTMLElement>('[data-testid="cours-piece-jointe"]');
}

async function verifierQueToutTient(monte: EcranCadre, temoin: string): Promise<void> {
  await stabiliser(monte, 4);

  expect(monte.hote.querySelector(temoin)).not.toBeNull();
  expect(elementsPerdus(monte)).withContext('éléments coupés').toEqual([]);
  monte.detruire();
}

function texteDe(element: Element | null): string | undefined {
  return element?.textContent?.replace(/\s+/g, ' ').trim();
}

describe('CoursPresentationComponent : pièce jointe d un écran', () => {
  beforeEach(() => setupTestBed({ imports: [CoursPresentationComponent] }));

  for (const mode of ['etudiant', 'formateur'] as const) {
    it(`V5 · en ${mode}, propose le fichier de l écran en téléchargement`, async () => {
      const monte = await monterDansUnCadre(ecranDuMode(mode, PIECE_JOINTE), mode, 1280, 720);
      const lien = pieceJointeAffichee(monte);

      expect({
        balise: lien?.tagName,
        href: lien?.getAttribute('href'),
        telechargement: lien?.hasAttribute('download'),
        texte: texteDe(lien),
      }).toEqual({
        balise: 'A',
        href: PIECE_JOINTE.fichier,
        telechargement: true,
        texte: `Télécharger ${PIECE_JOINTE.libelle}`,
      });
      monte.detruire();
    });
  }

  it('V5 · en projection, annonce le fichier sur les postes, sans lien', async () => {
    const monte = await monterDansUnCadre(
      ecranDuMode('projection', PIECE_JOINTE),
      'projection',
      1280,
      720,
    );
    const mention = pieceJointeAffichee(monte);

    expect({
      balise: mention?.tagName,
      liens: monte.hote.querySelectorAll('a[download]').length,
      texte: texteDe(mention),
    }).toEqual({
      balise: 'P',
      liens: 0,
      texte: `Sur votre poste : ${PIECE_JOINTE.libelle}`,
    });
    monte.detruire();
  });

  describe('réservée à la séance', () => {
    const PIECE_RESERVEE: PieceJointe = {
      libelle: 'Classeur de reprise de l’acte 2',
      reservee: true,
    };
    const CLASSEUR = buildFichierTelecharge();

    const monterLaPieceReservee = (
      mode: CoursPresentationMode,
      telechargement: TelechargementDePieceJointe | null,
    ): Promise<EcranCadre> =>
      monterDansUnCadre(
        ecranDuMode(mode, PIECE_RESERVEE),
        mode,
        1280,
        720,
        null,
        null,
        telechargement,
      );

    for (const mode of ['etudiant', 'formateur'] as const) {
      it(`V5 · en ${mode}, télécharge par l API le classeur de l écran sous le nom servi`, async () => {
        const telechargement = jasmine
          .createSpy<TelechargementDePieceJointe>('telechargement')
          .and.returnValue(of(CLASSEUR));
        const creation = spyOn(URL, 'createObjectURL').and.returnValue('blob:reprise');
        const clic = spyOn(HTMLAnchorElement.prototype, 'click');
        const monte = await monterLaPieceReservee(mode, telechargement);
        const bouton = pieceJointeAffichee(monte);

        bouton?.click();

        expect({
          balise: bouton?.tagName,
          texte: texteDe(bouton),
          ecran: telechargement.calls.mostRecent().args,
          contenu: creation.calls.mostRecent().args[0],
          nom: (clic.calls.mostRecent().object as HTMLAnchorElement).download,
        }).toEqual({
          balise: 'BUTTON',
          texte: `Télécharger ${PIECE_RESERVEE.libelle}`,
          ecran: [ecranDuMode(mode).id],
          contenu: jasmine.any(Blob),
          nom: CLASSEUR.nom,
        });
        monte.detruire();
      });
    }

    const ALERTES_D_ECHEC = {
      etudiant: 'Téléchargement impossible : réessayez, ou demandez le classeur au formateur.',
      formateur: 'Téléchargement impossible : réessayez.',
    } as const;

    const alerteDEchec = (monte: EcranCadre): HTMLElement | null =>
      monte.hote.querySelector<HTMLElement>('[data-testid="cours-piece-jointe-echec"]');

    const monterUnRefusPuisLeClasseur = async (mode: CoursPresentationMode, refus: Error) => {
      const telechargement = jasmine
        .createSpy<TelechargementDePieceJointe>('telechargement')
        .and.returnValues(
          throwError(() => refus),
          of(CLASSEUR),
        );
      spyOn(URL, 'createObjectURL').and.returnValue('blob:reprise');
      const clic = spyOn(HTMLAnchorElement.prototype, 'click');
      const monte = await monterLaPieceReservee(mode, telechargement);
      return {
        telechargement,
        clic,
        monte,
        bouton: pieceJointeAffichee(monte) as HTMLButtonElement,
      };
    };

    const ATTENTE_COMMUNE = 'Trop de tentatives en peu de temps : réessayez dans 2 min.';

    const REFUS_SIGNALES: readonly {
      readonly cas: string;
      readonly refus: Error;
      readonly alerte: (mode: 'etudiant' | 'formateur') => string;
    }[] = [
      { cas: 'refusé', refus: new Error('404'), alerte: (mode) => ALERTES_D_ECHEC[mode] },
      {
        cas: 'limité par la cadence du serveur',
        refus: new PieceJointeRefusee('indisponible', 429, { minutes: 2 }),
        alerte: () => ATTENTE_COMMUNE,
      },
    ];

    for (const mode of ['etudiant', 'formateur'] as const) {
      for (const { cas, refus, alerte } of REFUS_SIGNALES) {
        it(`V5 · en ${mode}, signale un téléchargement ${cas}, puis réessaie au clic suivant`, async () => {
          const { telechargement, clic, monte, bouton } = await monterUnRefusPuisLeClasseur(
            mode,
            refus,
          );

          bouton.click();
          await monte.rafraichir();
          const apresLEchec = {
            alerte: texteDe(alerteDEchec(monte)),
            role: alerteDEchec(monte)?.getAttribute('role'),
            desactive: bouton.disabled,
          };
          bouton.click();
          await monte.rafraichir();

          expect(apresLEchec).toEqual({
            alerte: alerte(mode),
            role: 'alert',
            desactive: false,
          });
          expect({
            appels: telechargement.calls.count(),
            telecharges: clic.calls.count(),
            alerte: alerteDEchec(monte),
          }).toEqual({ appels: 2, telecharges: 1, alerte: null });
          monte.detruire();
        });
      }
    }

    it('V5 · au poste, invite à réessayer une reprise retenue, sans échec, et l efface au téléchargement suivant', async () => {
      const { clic, monte, bouton } = await monterUnRefusPuisLeClasseur(
        'etudiant',
        new PieceJointeRefusee('retenue', 409),
      );
      const annonceDeRetenue = (): Element | null =>
        monte.hote.querySelector('[data-testid="cours-piece-jointe-retenue"]');

      bouton.click();
      await monte.rafraichir();
      const retenue = {
        annonce: texteDe(annonceDeRetenue()),
        role: annonceDeRetenue()?.getAttribute('role'),
        echec: alerteDEchec(monte),
        desactive: bouton.disabled,
      };
      bouton.click();
      await monte.rafraichir();

      expect(retenue).toEqual({
        annonce:
          'Classeur pas encore disponible : réessayez quand votre formateur aura révélé les activités qu’il reprend.',
        role: 'status',
        echec: null,
        desactive: false,
      });
      expect({ annonce: annonceDeRetenue(), telecharges: clic.calls.count() }).toEqual({
        annonce: null,
        telecharges: 1,
      });
      monte.detruire();
    });

    const cliquerAuPoste = async (
      enRoute: Subject<FichierTelecharge>,
    ): Promise<{ readonly premier: EcranContent; readonly monte: EcranCadre }> => {
      const premier = ecranDuMode('etudiant', PIECE_RESERVEE);
      const monte = await monterLaPieceReservee('etudiant', () => enRoute);
      pieceJointeAffichee(monte)?.click();
      return { premier, monte };
    };

    it('V5 · désactive le bouton tant que le classeur est en route', async () => {
      const enRoute = new Subject<FichierTelecharge>();
      spyOn(URL, 'createObjectURL').and.returnValue('blob:reprise');
      spyOn(HTMLAnchorElement.prototype, 'click');
      const monte = await monterLaPieceReservee('etudiant', () => enRoute);
      const bouton = pieceJointeAffichee(monte) as HTMLButtonElement;

      bouton.click();
      await monte.rafraichir();
      const pendantLEnvoi = bouton.disabled;
      enRoute.next(CLASSEUR);
      enRoute.complete();
      await monte.rafraichir();

      expect({ pendantLEnvoi, apres: bouton.disabled }).toEqual({
        pendantLEnvoi: true,
        apres: false,
      });
      monte.detruire();
    });

    it('V5 · un écran suivant repart d un bouton libre, et le classeur parti avant arrive quand même', async () => {
      const enRoute = new Subject<FichierTelecharge>();
      spyOn(URL, 'createObjectURL').and.returnValue('blob:reprise');
      const clic = spyOn(HTMLAnchorElement.prototype, 'click');
      const { premier, monte } = await cliquerAuPoste(enRoute);

      await monte.rafraichir();
      await monte.afficher({ ...premier, id: `${premier.id}-SUIVANT` });
      const surLeSuivant = (pieceJointeAffichee(monte) as HTMLButtonElement).disabled;
      enRoute.next(CLASSEUR);
      enRoute.complete();
      await monte.rafraichir();

      expect({
        surLeSuivant,
        telecharge: (clic.calls.mostRecent().object as HTMLAnchorElement).download,
      }).toEqual({ surLeSuivant: false, telecharge: CLASSEUR.nom });
      monte.detruire();
    });

    it('V5 · le classeur demandé arrive même si le poste a démonté la présentation', async () => {
      const enRoute = new Subject<FichierTelecharge>();
      spyOn(URL, 'createObjectURL').and.returnValue('blob:reprise');
      const clic = spyOn(HTMLAnchorElement.prototype, 'click');
      const { monte } = await cliquerAuPoste(enRoute);

      monte.detruire();
      enRoute.next(CLASSEUR);
      enRoute.complete();

      expect((clic.calls.mostRecent().object as HTMLAnchorElement).download).toBe(CLASSEUR.nom);
    });

    it('V5 · garde l échec de l écran quitté, et le montre au retour', async () => {
      const enRoute = new Subject<FichierTelecharge>();
      const { premier, monte } = await cliquerAuPoste(enRoute);

      await monte.afficher({ ...premier, id: `${premier.id}-SUIVANT` });
      enRoute.error(new Error('404'));
      await monte.rafraichir();
      const surLeSuivant = alerteDEchec(monte);
      await monte.afficher(premier);

      expect({ surLeSuivant, auRetour: texteDe(alerteDEchec(monte)) }).toEqual({
        surLeSuivant: null,
        auRetour: ALERTES_D_ECHEC.etudiant,
      });
      monte.detruire();
    });

    it('V5 · en projection, annonce la pièce réservée sur les postes, sans bouton', async () => {
      const monte = await monterLaPieceReservee('projection', null);
      const mention = pieceJointeAffichee(monte);

      expect({
        balise: mention?.tagName,
        boutons: monte.hote.querySelectorAll('button.cours-piece-jointe').length,
        texte: texteDe(mention),
      }).toEqual({
        balise: 'P',
        boutons: 0,
        texte: `Sur votre poste : ${PIECE_RESERVEE.libelle}`,
      });
      monte.detruire();
    });

    it('V5 · sans moyen de la télécharger, ne propose pas la pièce réservée', async () => {
      const monte = await monterLaPieceReservee('etudiant', null);

      expect(pieceJointeAffichee(monte)).toBeNull();
      monte.detruire();
    });

    it('V5 · l écran, son bouton et l alerte d échec tiennent dans la toile', async () => {
      const monte = await monterLaPieceReservee('etudiant', () =>
        throwError(() => new Error('404')),
      );
      pieceJointeAffichee(monte)?.click();

      await verifierQueToutTient(monte, '[data-testid="cours-piece-jointe-echec"]');
    });
  });

  for (const mode of MODES) {
    it(`V5 · en ${mode}, n affiche aucune pièce jointe sur un écran qui n en a pas`, async () => {
      const monte = await monterDansUnCadre(ecranDuMode(mode), mode, 1280, 720);

      expect(pieceJointeAffichee(monte)).toBeNull();
      monte.detruire();
    });

    it(`V5 · en ${mode}, l écran et sa pièce jointe tiennent dans la toile`, async () => {
      const monte = await monterDansUnCadre(ecranDuMode(mode, PIECE_JOINTE), mode, 1280, 720);

      await verifierQueToutTient(monte, '[data-testid="cours-piece-jointe"]');
    });
  }

  for (const [cas, fichier] of [
    ['qui remonte d un dossier', '/assets/cours/b3-01/../secret.0c1d2e3f.xlsx'],
    ['rangé dans un sous-dossier', '/assets/cours/b3-01/reprises/piege.0c1d2e3f.xlsx'],
    ['servi par une autre origine', 'https://exemple.test/assets/cours/b3-01/piege.0c1d2e3f.xlsx'],
    ['servi par une origine implicite', '//exemple.test/assets/cours/b3-01/piege.0c1d2e3f.xlsx'],
    ['relatif', 'assets/cours/b3-01/piege.0c1d2e3f.xlsx'],
    ['hors des assets des cours', '/assets/images/b3-01/piege.0c1d2e3f.xlsx'],
    ['encodé', '/assets/cours/b3-01/%2e%2e%2fsecret.0c1d2e3f.xlsx'],
    ['exécutable', '/assets/cours/b3-01/piege.0c1d2e3f.exe'],
    ['à macros', '/assets/cours/b3-01/piege.0c1d2e3f.xlsm'],
    ['à l empreinte tronquée', '/assets/cours/b3-01/piege.3f9a.xlsx'],
    [
      'sans empreinte, qu un cache servirait encore après une correction',
      '/assets/cours/b3-01/B3-01_export_ventes.xlsx',
    ],
  ]) {
    it(`V5 · ne propose aucun fichier ${cas}`, async () => {
      const monte = await monterDansUnCadre(
        ecranDuMode('etudiant', { libelle: 'Classeur', fichier }),
        'etudiant',
        1280,
        720,
      );

      expect(pieceJointeAffichee(monte)).toBeNull();
      monte.detruire();
    });
  }
});

function monterDansLePoste(poste: string): { chrome: HTMLElement; slide: HTMLElement } {
  const conteneur = document.createElement('div');
  conteneur.className = poste;
  conteneur.innerHTML = `
    <button type="button" data-testid="chrome">Écran suivant</button>
    <app-cours-presentation>
      <button type="button" class="slide-grid__card" data-testid="slide">Mesure</button>
    </app-cours-presentation>
  `;
  document.body.appendChild(conteneur);
  const lire = (marque: string): HTMLElement => {
    const element = conteneur.querySelector<HTMLElement>(`[data-testid="${marque}"]`);
    if (element === null) {
      throw new Error(`Aucun bouton ${marque} dans le poste ${poste}`);
    }
    return element;
  };
  return { chrome: lire('chrome'), slide: lire('slide') };
}

describe('CoursPresentationComponent dans les postes du cours', () => {
  afterEach(() => {
    POSTES.forEach((poste) => document.querySelector(`.${poste}`)?.remove());
  });

  for (const poste of POSTES) {
    it(`R4/R8 · ne donne pas le style pilule du poste ${poste} aux boutons du contenu d une slide`, () => {
      const { chrome, slide } = monterDansLePoste(poste);
      const styleDuChrome = getComputedStyle(chrome);
      const styleDeLaSlide = getComputedStyle(slide);

      expect(styleDeLaSlide.borderTopLeftRadius).not.toBe(styleDuChrome.borderTopLeftRadius);
      expect(styleDeLaSlide.minHeight).not.toBe(styleDuChrome.minHeight);
    });
  }
});
