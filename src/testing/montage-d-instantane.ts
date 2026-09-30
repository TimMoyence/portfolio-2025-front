import type { EcranContent, Role } from '../cours/content/types';
import { SlideActivityComponent } from '../app/shared/slides/session/slide-activity.component';
import { recolterDansLArbre } from './arbre-json';
import { DELAI_DE_MONTAGE_MS, monterEcran } from './briques-montees';
import {
  ecransDuPupitreDe,
  ecransPublicsDe,
  type InstantaneDuCoursB2,
} from './fixtures/instantane-de-cours';
import { setupTestBed } from './setup-test-bed';

const CLES_SECRETES = [
  'corriges',
  'corrigeEcran',
  'notes',
  'guide',
  'solution',
  'misconception',
  'interaction',
  'pieges',
];

export function ecranNomme<T extends EcranContent>(ecrans: readonly T[], id: string): T {
  const ecran = ecrans.find((candidat) => candidat.id === id);
  if (ecran === undefined) {
    throw new Error(`écran absent de l instantané : ${id}`);
  }
  return ecran;
}

export function texteServiAuPosteEtudiant(instantane: InstantaneDuCoursB2, id: string): string {
  return JSON.stringify(ecranNomme(ecransPublicsDe(instantane), id));
}

function clesDe(valeur: unknown): readonly string[] {
  return recolterDansLArbre(valeur, (cle, contenu, descendre) => [cle, ...descendre(contenu)]);
}

export async function attesterLeMontage(ecran: EcranContent, role: Role): Promise<void> {
  const monte = await monterEcran(ecran, role);

  expect(monte.erreurs).toEqual([]);
  expect(monte.element.querySelector('[data-testid="slide-activity-error"]')).toBeNull();
  expect(monte.element.querySelector('[data-testid="slide-activity-unknown"]')).toBeNull();
  expect(monte.element.querySelector('app-slide-visual [role="alert"]'))
    .withContext(`${ecran.id} en ${role}`)
    .toBeNull();
  expect(
    monte.montees().every((brique) => brique.getAttribute('data-cours-role') === role),
  ).toBeTrue();
  expect(monte.montees().some((brique) => brique.hasAttribute('render'))).toBeFalse();
  expect(
    monte
      .montees()
      .every(
        (brique) =>
          brique.shadowRoot?.querySelector('.fp-root')?.getAttribute('data-role') === role,
      ),
  ).toBeTrue();
  monte.detruire();
}

export interface AttenduDeLInstantane {
  readonly empreinte: string;
  readonly ecrans: number;
  readonly publicsAuCatalogue?: readonly string[];
  readonly textesAuPupitre?: readonly TextesAttendus[];
  readonly saisiesDuPosteEtudiant?: readonly SaisiesAttendues[];
  readonly specifiques?: () => void;
}

export interface TextesAttendus {
  readonly ecran: string;
  readonly textes: readonly string[];
}

export interface SaisiesAttendues extends TextesAttendus {
  readonly selecteur: string;
}

function decrireLesTextesAuPupitre(
  instantane: InstantaneDuCoursB2,
  attendus: readonly TextesAttendus[],
): void {
  for (const { ecran, textes } of attendus) {
    it(
      `affiche au pupitre ${ecran} avec ${textes.join(', ')}`,
      async () => {
        const monte = await monterEcran(
          ecranNomme(ecransDuPupitreDe(instantane), ecran),
          'presentateur',
        );

        expect(monte.erreurs).toEqual([]);
        for (const texte of textes) {
          expect(monte.element.textContent).toContain(texte);
        }
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  }
}

function decrireLesSaisiesDuPosteEtudiant(
  instantane: InstantaneDuCoursB2,
  attendues: readonly SaisiesAttendues[],
): void {
  for (const { ecran, selecteur, textes } of attendues) {
    it(
      `monte ${ecran} au poste étudiant avec ses saisies ${selecteur}`,
      async () => {
        const monte = await monterEcran(
          ecranNomme(ecransDuPupitreDe(instantane), ecran),
          'etudiant',
        );
        const racine = monte.montees()[0].shadowRoot;

        expect(monte.erreurs).toEqual([]);
        for (const texte of textes) {
          expect(racine?.textContent).toContain(texte);
        }
        expect(racine?.querySelectorAll(selecteur).length).toBeGreaterThan(0);
        monte.detruire();
      },
      DELAI_DE_MONTAGE_MS,
    );
  }
}

export function decrireLeMontageDeLInstantane(
  cours: string,
  instantane: InstantaneDuCoursB2,
  attendu: AttenduDeLInstantane,
): void {
  describe(`AC-24 : l instantané réel du ${cours} servi par le back se monte pour l étudiant et pour le présentateur`, () => {
    beforeEach(() => setupTestBed({ imports: [SlideActivityComponent] }));

    attendu.specifiques?.();
    decrireLesTextesAuPupitre(instantane, attendu.textesAuPupitre ?? []);
    decrireLesSaisiesDuPosteEtudiant(instantane, attendu.saisiesDuPosteEtudiant ?? []);

    const publicsAuCatalogue = attendu.publicsAuCatalogue;
    if (publicsAuCatalogue !== undefined) {
      it(`reprend au catalogue les ${publicsAuCatalogue.length} écrans publics et verrouille les autres`, () => {
        const publics = instantane.catalogue.ecrans.filter(
          (ecran) => ecran.type !== 'ecran-verrouille',
        );

        expect(publics.map((ecran) => ecran.id.slice(6))).toEqual([...publicsAuCatalogue]);
      });
    }

    it('porte l empreinte et le nombre d écrans publiés par le back', () => {
      expect(instantane.empreinte).toBe(attendu.empreinte);
      expect([
        ecransPublicsDe(instantane).length,
        ecransDuPupitreDe(instantane).length,
        instantane.catalogue.ecrans.length,
      ]).toEqual([attendu.ecrans, attendu.ecrans, attendu.ecrans]);
      expect(ecransDuPupitreDe(instantane).map((ecran) => ecran.id)).toEqual(
        ecransPublicsDe(instantane).map((ecran) => ecran.id),
      );
    });

    it('ne livre au poste étudiant ni corrigé, ni notes, ni guide', () => {
      const clesPubliees = new Set(clesDe(ecransPublicsDe(instantane)));

      for (const cle of CLES_SECRETES) {
        expect(clesPubliees.has(cle)).withContext(`clé secrète publiée : ${cle}`).toBeFalse();
      }
      expect(clesPubliees.has('donnees')).toBeTrue();
    });

    for (const ecran of ecransPublicsDe(instantane)) {
      it(
        `${ecran.id} (${ecran.type}) pour l étudiant`,
        () => attesterLeMontage(ecran, 'etudiant'),
        DELAI_DE_MONTAGE_MS,
      );
    }

    for (const ecran of ecransDuPupitreDe(instantane)) {
      it(
        `${ecran.id} (${ecran.type}) pour le présentateur`,
        () => attesterLeMontage(ecran, 'presentateur'),
        DELAI_DE_MONTAGE_MS,
      );
    }
  });
}
