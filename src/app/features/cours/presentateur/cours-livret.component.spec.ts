import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import type { LivretDuCours } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { INSTANTANE_B2_02 } from '../../../../testing/fixtures/instantane-b2-02';
import {
  buildDerouleCours,
  buildEcranDeroule,
  buildGuideFormateur,
  buildLivretDuCours,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import { briqueMontee } from '../../../../testing/briques-montees';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { CoursLivretComponent } from './cours-livret.component';

type Fixture = ComponentFixture<CoursLivretComponent>;

const SLUG = 'b2-02-series-statistiques';

const LIVRET_B2_02: LivretDuCours = {
  version: 1,
  sujet: INSTANTANE_B2_02.sujet,
  corrige: INSTANTANE_B2_02.deroule,
};

async function monter(livret: Observable<LivretDuCours>): Promise<{
  fixture: Fixture;
  port: ReturnType<typeof createFormationsPortStub>;
}> {
  const port = createFormationsPortStub();
  port.lireLivret.and.returnValue(livret);
  setupTestBed({
    imports: [CoursLivretComponent],
    providers: [{ provide: FORMATIONS_PORT, useValue: port }],
  });
  const fixture = TestBed.createComponent(CoursLivretComponent);
  fixture.componentRef.setInput('slug', SLUG);
  fixture.detectChanges();
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
  return { fixture, port };
}

function tous(fixture: Fixture, testId: string): HTMLElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      `[data-testid="${testId}"]`,
    ),
  );
}

function un(fixture: Fixture, testId: string): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
    `[data-testid="${testId}"]`,
  );
}

function basculerSurLeCorrige(fixture: Fixture): void {
  un(fixture, 'livret-vue-corrige')?.click();
  fixture.detectChanges();
}

describe('CoursLivretComponent', () => {
  it('lit le livret du cours demandé et en affiche le titre et la version', async () => {
    const { fixture, port } = await monter(of(LIVRET_B2_02));

    expect(port.lireLivret).toHaveBeenCalledOnceWith(SLUG);
    expect(un(fixture, 'livret-titre')?.textContent).toContain(INSTANTANE_B2_02.sujet.titre);
    expect(un(fixture, 'livret-version')?.textContent).toContain('1');
  });

  it('met en page pour l’étudiant les 25 écrans du B2-02 à traiter sur papier, rappel compris, sans correction ni jalon', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));

    const ids = tous(fixture, 'livret-ecran').map((page) => page.dataset['ecran']);

    expect(ids.length).toBe(25);
    expect(ids).not.toContain('B2-02-A1-07-CORRECTION');
    expect(ids).not.toContain('B2-02-A1-09-JALON');
    expect(ids).toContain('B2-02-A4-04-RAPPEL');
    expect(ids).toContain('B2-02-A2-01-NUAGE-RIVAGE');
    expect(tous(fixture, 'livret-corrige')).toEqual([]);
  });

  it('découpe le livret étudiant en feuilles distribuées après chaque correction, pour ne pas livrer une réponse d’avance', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));

    const feuilles = tous(fixture, 'livret-feuille');
    const feuilleDe = (ecran: string): number =>
      feuilles.findIndex((feuille) => feuille.querySelector(`[data-ecran="${ecran}"]`) !== null);

    expect(feuilles.length).toBe(15);
    expect(tous(fixture, 'livret-ecran').length).toBe(25);
    expect(
      feuilles.map((feuille) =>
        feuille.querySelector('[data-testid="livret-feuille-entete"]')?.textContent?.trim(),
      ),
    ).toEqual(feuilles.map((_, rang) => `Feuille ${rang + 1} / 15`));
    for (const [exercice, suite] of [
      ['B2-02-A1-05-UN-SEUL-NOMBRE', 'B2-02-A1-06-COURS-RESUMER'],
      ['B2-02-A2-02-VOTE-CORRELATION', 'B2-02-A2-03-COURS-NUAGE'],
      ['B2-02-A3-01-JUSQU-OU', 'B2-02-A3-02-COURS-DROITE'],
      ['B2-02-A4-04-RAPPEL', 'B2-02-A4-05-FICHE-MEMO'],
      ['B2-02-A2-05-ATELIER-NUAGE', 'B2-02-A2-06-ECARTS-POINT-MOYEN'],
      ['B2-02-A3-04-ATELIER-DROITE', 'B2-02-A3-05-DEFI-IA'],
      ['B2-02-A4-02-TABLEUR-FIBRE', 'B2-02-A4-03-COFFRE-FIBRE'],
      ['B2-02-A1-08-ATELIER-RESUME', 'B2-02-A4-06-BILLET-DE-SORTIE'],
      ['B2-02-A3-04-ATELIER-DROITE', 'B2-02-A4-06-BILLET-DE-SORTIE'],
    ]) {
      expect(feuilleDe(exercice)).withContext(exercice).toBeGreaterThanOrEqual(0);
      expect(feuilleDe(exercice)).withContext(suite).toBeLessThan(feuilleDe(suite));
    }
  });

  it('titre au livret étudiant les exercices dont la brique n’imprime pas d’intitulé', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));

    const titres = tous(fixture, 'livret-titre-ecran').map((titre) => titre.textContent?.trim());

    expect(titres).toEqual([
      'Exercice 3 — Les écarts au point moyen',
      'Exercice 5 — Corriger la prévision d’une IA',
    ]);
  });

  it('bascule sur le corrigé des 35 écrans du B2-02, corrections et rappel compris', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));

    basculerSurLeCorrige(fixture);

    const ids = tous(fixture, 'livret-corrige').map((page) => page.dataset['ecran']);
    expect(ids.length).toBe(35);
    expect(ids).toContain('B2-02-A1-07-CORRECTION');
    expect(ids).toContain('B2-02-A4-04-RAPPEL');
    expect(tous(fixture, 'livret-ecran')).toEqual([]);
  });

  describe('briques imprimées sur le vrai B2-02', () => {
    function ombreDe(brique: HTMLElement): string {
      return brique.shadowRoot?.textContent?.replace(/\s+/g, ' ') ?? '';
    }

    function briqueDeLaPage(ecran: string, balise: string): string {
      return `[data-ecran="${ecran}"] ${balise}`;
    }

    it('imprime au livret les quatre énigmes du coffre, sans champ de saisie', async () => {
      const { fixture } = await monter(of(LIVRET_B2_02));

      const coffre = await briqueMontee(
        fixture,
        briqueDeLaPage('B2-02-A4-03-COFFRE-FIBRE', 'fp-escape'),
      );

      expect(coffre.shadowRoot?.querySelectorAll('[data-testid="enonce"]').length).toBe(4);
      expect(coffre.shadowRoot?.querySelector('[data-testid="saisie"]')).toBeNull();
    });

    it('imprime au livret les deux questions du vote sur la corrélation', async () => {
      const { fixture } = await monter(of(LIVRET_B2_02));

      const vote = await briqueMontee(
        fixture,
        briqueDeLaPage('B2-02-A2-02-VOTE-CORRELATION', 'fp-vote'),
      );

      expect(vote.shadowRoot?.querySelectorAll('legend').length).toBe(2);
    });

    it('imprime au livret toute la banque du rappel en tête de feuille', async () => {
      const { fixture } = await monter(of(LIVRET_B2_02));

      const rappel = await briqueMontee(fixture, briqueDeLaPage('B2-02-A4-04-RAPPEL', 'fp-spaced'));

      expect(rappel.shadowRoot?.querySelectorAll('[data-testid="enonce"]').length).toBe(12);
    });

    it('imprime au corrigé le raisonnement de l’exemple guidé A1-07', async () => {
      const { fixture } = await monter(of(LIVRET_B2_02));
      basculerSurLeCorrige(fixture);

      const exemple = await briqueMontee(
        fixture,
        briqueDeLaPage('B2-02-A1-07-EXEMPLE-RESUME', 'fp-worked'),
      );

      expect(ombreDe(exemple)).toContain('340 ÷ 8 = 42,5');
      expect(ombreDe(exemple)).toContain('18,66');
    });

    it('imprime au corrigé les solutions du coffre', async () => {
      const { fixture } = await monter(of(LIVRET_B2_02));
      basculerSurLeCorrige(fixture);

      const coffre = await briqueMontee(
        fixture,
        briqueDeLaPage('B2-02-A4-03-COFFRE-FIBRE', 'fp-escape'),
      );

      expect(coffre.shadowRoot?.querySelectorAll('[data-testid="solution"]').length).toBe(4);
    });

    it('imprime au corrigé la réponse attendue des réflexions A1-05 et A3-01', async () => {
      const { fixture } = await monter(of(LIVRET_B2_02));
      basculerSurLeCorrige(fixture);

      for (const ecran of ['B2-02-A1-05-UN-SEUL-NOMBRE', 'B2-02-A3-01-JUSQU-OU']) {
        const page = tous(fixture, 'livret-corrige').find(
          (candidate) => candidate.dataset['ecran'] === ecran,
        );
        const attendu = INSTANTANE_B2_02.deroule.ecrans.find((e) => e.id === ecran)?.corrigeEcran;
        expect(attendu?.type).withContext(ecran).toBe('reflexion');
        expect(page?.querySelector('[data-testid="livret-attendu"]')?.textContent)
          .withContext(ecran)
          .toContain(attendu?.type === 'reflexion' ? attendu.attendu : '');
      }
    });
  });

  it('accompagne chaque écran du corrigé de ses notes, de ses bonnes réponses et du guide formateur', async () => {
    const livret = buildLivretDuCours({
      corrige: buildDerouleCours({
        ecrans: [buildEcranDeroule({ id: 'ecran-guide', guide: buildGuideFormateur() })],
      }),
    });
    const { fixture } = await monter(of(livret));

    basculerSurLeCorrige(fixture);

    expect(un(fixture, 'livret-notes')?.textContent).toContain(
      'Rappeler la formule de capitalisation',
    );
    expect(un(fixture, 'livret-reponses')?.textContent).toContain('1480.24');
    expect(un(fixture, 'livret-guide')?.textContent).toContain('Des milliers d’euros');
  });

  it('numérote chaque bonne réponse du corrigé par l’énoncé de sa question, sans identifiant technique', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));

    basculerSurLeCorrige(fixture);

    const diagnostic = tous(fixture, 'livret-corrige').find(
      (page) => page.dataset['ecran'] === 'B2-02-A1-01-DIAGNOSTIC',
    );
    const reponses = diagnostic?.querySelector('[data-testid="livret-reponses"]')?.textContent;
    expect(reponses).toContain('1.');
    expect(reponses).toContain('Cinq clients ont payé leur facture');
    expect(reponses).toContain('30 jours');
    expect(reponses).not.toContain('b2-02-a1-diagnostic');
  });

  it('imprime la vue affichée', async () => {
    const { fixture } = await monter(of(LIVRET_B2_02));
    const imprimer = spyOn(window, 'print');

    un(fixture, 'livret-imprimer')?.click();

    expect(imprimer).toHaveBeenCalledTimes(1);
  });

  it('signale un livret illisible au lieu d’une page vide', async () => {
    const { fixture } = await monter(throwError(() => new Error('403')));

    expect(un(fixture, 'livret-echec')?.getAttribute('role')).toBe('alert');
    expect(tous(fixture, 'livret-ecran')).toEqual([]);
  });
});
