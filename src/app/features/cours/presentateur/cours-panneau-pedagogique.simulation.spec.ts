import { fakeAsync, tick } from '@angular/core/testing';
import * as fc from 'fast-check';
import { of } from 'rxjs';
import {
  buildAnnotationFormateur,
  createFormationsPortStub,
} from '../../../../testing/factories/formations.factory';
import type { FixtureDuPanneau } from '../../../../testing/panneau-pedagogique';
import {
  ECRAN_DU_PANNEAU,
  monterLePanneau,
  noteAffichee,
  preparerLePanneau,
  relireLePanneau,
  saisirLaNoteDuPanneau,
} from '../../../../testing/panneau-pedagogique';
import type { AnnotationFormateur, FormationsPort } from '../../../core/ports/formations.port';

const DELAI_ENREGISTREMENT_MS = 600;
const DEPART = Date.parse('2026-09-20T08:00:00.000Z');
const TIRAGE = { seed: 20260920, numRuns: 40 };
const ATTENTES = [50, 200, 599, 600, 900];

type Coup =
  | { readonly frappe: string }
  | { readonly attente: number }
  | { readonly relecturePerimee: boolean };

class ServeurDAnnotations {
  private horloge = 0;
  private courante: AnnotationFormateur | null = null;
  private precedente: AnnotationFormateur | null = null;
  perime = false;
  readonly recues: string[] = [];

  ecrire(note: string): AnnotationFormateur {
    this.recues.push(note);
    this.horloge += 1;
    this.precedente = this.courante;
    this.courante = buildAnnotationFormateur({
      screenId: ECRAN_DU_PANNEAU,
      note,
      updatedAt: new Date(DEPART + this.horloge * 1000).toISOString(),
    });
    return this.courante;
  }

  lire(): readonly AnnotationFormateur[] {
    const servie = this.perime && this.precedente !== null ? this.precedente : this.courante;
    return servie === null ? [] : [servie];
  }

  noteEnregistree(): string | null {
    return this.courante?.note ?? null;
  }
}

const coup: fc.Arbitrary<Coup> = fc.oneof(
  fc.integer({ min: 1, max: 999 }).map((rang) => ({ frappe: `note-${rang}` })),
  fc.constantFrom(...ATTENTES).map((attente) => ({ attente })),
  fc.boolean().map((relecturePerimee) => ({ relecturePerimee })),
);

function estSousSuite(petite: readonly string[], grande: readonly string[]): boolean {
  let rang = 0;
  for (const valeur of grande) {
    if (rang < petite.length && petite[rang] === valeur) {
      rang += 1;
    }
  }
  return rang === petite.length;
}

describe('simulation : frappes et relectures entrelacees sur le panneau pedagogique', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let serveur: ServeurDAnnotations;

  function relire(fixture: FixtureDuPanneau, perime: boolean): void {
    serveur.perime = perime;
    relireLePanneau(fixture);
  }

  function jouer(fixture: FixtureDuPanneau, joue: Coup): void {
    if ('frappe' in joue) {
      saisirLaNoteDuPanneau(fixture, joue.frappe);
      return;
    }
    if ('attente' in joue) {
      tick(joue.attente);
      fixture.detectChanges();
      return;
    }
    relire(fixture, joue.relecturePerimee);
  }

  function derouler(coups: readonly Coup[]): { fixture: FixtureDuPanneau; frappes: string[] } {
    serveur = new ServeurDAnnotations();
    const fixture = monterLePanneau();
    const frappes: string[] = [];
    for (const joue of coups) {
      if ('frappe' in joue) {
        frappes.push(joue.frappe);
      }
      jouer(fixture, joue);
    }
    tick(DELAI_ENREGISTREMENT_MS * 3);
    fixture.detectChanges();
    return { fixture, frappes };
  }

  beforeEach(() => {
    serveur = new ServeurDAnnotations();
    port = createFormationsPortStub();
    port.lireAnnotations.and.callFake(() => of({ annotations: serveur.lire() }));
    port.enregistrerAnnotation.and.callFake((_, annotation) => of(serveur.ecrire(annotation.note)));
    preparerLePanneau(port);
  });

  function surTousLesDeroules(
    verifier: (fixture: FixtureDuPanneau, frappes: readonly string[]) => void,
  ): void {
    fc.assert(
      fc.property(fc.array(coup, { minLength: 1, maxLength: 25 }), (coups) => {
        const { fixture, frappes } = derouler(coups);
        verifier(fixture, frappes);
        fixture.destroy();
      }),
      TIRAGE,
    );
  }

  it('n ecrase jamais la note tapee, quelle que soit la relecture qui arrive', fakeAsync(() => {
    surTousLesDeroules((fixture, frappes) => {
      if (frappes.length > 0) {
        expect(noteAffichee(fixture)).toBe(frappes[frappes.length - 1]);
      }
    });
  }));

  it('envoie les notes dans l ordre des frappes, sans en inventer aucune', fakeAsync(() => {
    surTousLesDeroules((_fixture, frappes) => {
      const envoyees = [...serveur.recues];

      expect(envoyees.every((note) => frappes.includes(note))).toBeTrue();
      expect(estSousSuite(envoyees, frappes)).toBeTrue();
      if (frappes.length > 0) {
        expect(envoyees[envoyees.length - 1]).toBe(frappes[frappes.length - 1]);
        expect(serveur.noteEnregistree()).toBe(frappes[frappes.length - 1]);
      }
    });
  }));

  it('ne renvoie une note que 600 ms apres la derniere frappe de la rafale', fakeAsync(() => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 999 }), { minLength: 2, maxLength: 8 }),
        (rangs) => {
          serveur = new ServeurDAnnotations();
          const fixture = monterLePanneau();
          for (const rang of rangs) {
            saisirLaNoteDuPanneau(fixture, `note-${rang}`);
            tick(DELAI_ENREGISTREMENT_MS - 1);
          }

          expect(serveur.recues).toEqual([]);

          tick(1);
          fixture.detectChanges();

          expect(serveur.recues).toEqual([`note-${rangs[rangs.length - 1]}`]);
          fixture.destroy();
        },
      ),
      TIRAGE,
    );
  }));

  it('refuse une relecture perimee apres un enregistrement plus recent', fakeAsync(() => {
    const fixture = monterLePanneau();

    saisirLaNoteDuPanneau(fixture, 'premiere');
    tick(DELAI_ENREGISTREMENT_MS);
    saisirLaNoteDuPanneau(fixture, 'seconde');
    tick(DELAI_ENREGISTREMENT_MS);
    relire(fixture, true);

    expect(serveur.recues).toEqual(['premiere', 'seconde']);
    expect(noteAffichee(fixture)).toBe('seconde');
    expect(serveur.noteEnregistree()).toBe('seconde');
    fixture.destroy();
  }));
});
