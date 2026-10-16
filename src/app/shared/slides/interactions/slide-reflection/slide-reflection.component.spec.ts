import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, fakeAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FORMATIONS_PORT, ReponseLibreRefusee } from '../../../../core/ports/formations.port';
import type {
  FormationsPort,
  MotifRefusReponseLibre,
} from '../../../../core/ports/formations.port';
import { createFormationsPortStub } from '../../../../../testing/factories/formations.factory';
import {
  configurerLHoteDInteraction,
  monterApresChargement,
} from '../../../../../testing/hote-d-interaction';
import { horlogesDeSaisie, sousHorlogeArreteeA } from '../../../../../testing/horloge-simulee';
import type { ModeInteraction } from '../mode-interaction';
import {
  clearIdentity,
  readIdentity,
  saveIdentity,
} from '../../../../../cours/runtime/core/identity';
import { enqueueFreeResponse, pendingFreeResponses } from './free-response.queue';
import { ecransPublicsDe } from '../../../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../../../testing/fixtures/instantanes-des-cours';
import { ReponsesLibresService } from '../../session/reponses-libres.service';
import { presentationDe } from '../../visual/presentation-v2';
import type { ReflectionInteraction } from './slide-reflection.component';
import { SlideReflectionComponent } from './slide-reflection.component';

const cleEtudiante = (): string => readIdentity()?.studentKey ?? '';

const ATTENTE_COMMUNE = 'Trop de tentatives en peu de temps : réessayez dans 2 min.';

interface ReflexionServie {
  readonly screenId: string;
  readonly promptData: ReflectionInteraction;
}

const REFLEXIONS_SERVIES: readonly ReflexionServie[] = INSTANTANES_DES_COURS_SERVIS.flatMap(
  ([, instantane]) =>
    ecransPublicsDe(instantane).flatMap((ecran) => {
      const presentation = presentationDe(ecran);
      return presentation?.renderer === 'reflection'
        ? [
            {
              screenId: ecran.id,
              promptData: presentation.props['promptData'] as ReflectionInteraction,
            },
          ]
        : [];
    }),
);

@Component({
  standalone: true,
  imports: [SlideReflectionComponent],
  template: ` <app-slide-reflection slug="ia-solopreneurs" interactionId="reflect-1" /> `,
})
class HostComponent {}

describe('SlideReflectionComponent', () => {
  let formations: jasmine.SpyObj<FormationsPort>;

  beforeEach(() => {
    clearIdentity();
    saveIdentity({ prenom: 'Anais', nom: 'Rivet', email: 'anais@example.com' });
    formations = createFormationsPortStub();
    configurerLHoteDInteraction(
      HostComponent,
      {
        'reflect-1': {
          scroll: [
            {
              type: 'reflection',
              question: 'Quelle tâche aimerais-tu déléguer à une IA ?',
              placeholder: 'Ex: relances email',
            },
          ],
        },
      },
      [{ provide: FORMATIONS_PORT, useValue: formations }],
    );
  });

  function racine(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function garder(fixture: ComponentFixture<unknown>, texte: string): void {
    const zone = racine(fixture).querySelector('textarea') as HTMLTextAreaElement;
    zone.value = texte;
    zone.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (racine(fixture).querySelector('.slide-reflection__save') as HTMLButtonElement).click();
  }

  function monterEnSeance(
    mode: ModeInteraction,
    sessionId: string | null,
    reflexion: ReflexionServie = {
      screenId: 'ecran-1',
      promptData: {
        id: 'reflexion-1',
        type: 'reflection',
        question: 'Pourquoi comparer les bases ?',
      },
    },
  ): ComponentFixture<SlideReflectionComponent> {
    const fixture = TestBed.createComponent(SlideReflectionComponent);
    fixture.componentRef.setInput('promptData', reflexion.promptData);
    fixture.componentRef.setInput('screenId', reflexion.screenId);
    fixture.componentRef.setInput('sessionId', sessionId);
    fixture.componentRef.setInput('jeton', 'jeton-1');
    fixture.componentRef.setInput('mode', mode);
    fixture.detectChanges();
    return fixture;
  }

  it('rend prompt et textarea', fakeAsync(() => {
    const fixture = monterApresChargement(HostComponent);
    expect(racine(fixture).querySelector('.slide-reflection__prompt')?.textContent).toContain(
      'Quelle tâche',
    );
    expect(racine(fixture).querySelector('textarea')).toBeTruthy();
  }));

  it('sans seance, se presente en apercu : rien n est envoye, rien ne reste en attente', fakeAsync(() => {
    const fixture = monterApresChargement(HostComponent);

    expect(racine(fixture).querySelector('[data-testid="slide-reflection-apercu"]')).not.toBeNull();
    expect(racine(fixture).querySelector('.slide-reflection__save')).toBeNull();
    expect(racine(fixture).textContent).not.toContain('en attente');
    expect(formations.enregistrerReponseLibre).not.toHaveBeenCalled();
  }));

  it('T9 · ouvre le raisonnement attendu une fois la réflexion révélée, et rien avant', () => {
    const fixture = monterEnSeance('seance', 'session-1');
    const debrief = (): HTMLDetailsElement | null =>
      racine(fixture).querySelector('[data-testid="slide-reflection-debrief"]');

    expect(debrief()).toBeNull();

    fixture.componentRef.setInput('debrief', {
      attendu: 'Un montant et un taux, sur deux dates.',
      suite: 'Nommez toujours le dénominateur.',
    });
    fixture.detectChanges();

    expect(debrief()?.open).toBeTrue();
    expect(debrief()?.textContent).toContain('Un montant et un taux, sur deux dates.');
    expect(debrief()?.textContent).toContain('Nommez toujours le dénominateur.');
  });

  it('en projection, montre la consigne sans zone de saisie', () => {
    const fixture = monterEnSeance('projection', null);

    expect(racine(fixture).textContent).toContain('Pourquoi comparer les bases ?');
    expect(racine(fixture).querySelector('textarea')).toBeNull();
    expect(racine(fixture).querySelector('.slide-reflection__save')).toBeNull();
    expect(
      racine(fixture).querySelector('[data-testid="slide-reflection-projection"]'),
    ).not.toBeNull();
  });

  describe('durée de réponse envoyée à la séance', () => {
    const horloge = sousHorlogeArreteeA(new Date('2026-10-16T08:00:00Z'));

    function dureeEnvoyee(avantLEnvoi: () => void): number | undefined {
      const envoyer = spyOn(TestBed.inject(ReponsesLibresService), 'envoyer').and.resolveTo(
        'enregistre',
      );
      const fixture = monterEnSeance('seance', 'seance-duree');
      avantLEnvoi();

      garder(fixture, 'Comparer les bases.');
      return envoyer.calls.mostRecent()?.args[2].dureeMs;
    }

    it('mesure le temps écoulé depuis l affichage de la réflexion', () => {
      expect(dureeEnvoyee(() => jasmine.clock().tick(4200))).toBe(4200);
    });

    it('envoie la durée écoulée quand l horloge recule de plus que cette durée avant l envoi', () => {
      expect(
        dureeEnvoyee(() => {
          jasmine.clock().tick(300);
          horloge.reculerDe(1000);
        }),
      ).toBe(300);
    });
  });

  describe('etats de l envoi en seance', () => {
    const CLE = (sessionId: string): string => `${cleEtudiante()}:${sessionId}:ecran-1:reflexion-1`;

    async function clesEnAttente(sessionId: string): Promise<string[]> {
      return (await pendingFreeResponses(sessionId, cleEtudiante())).map((envoi) => envoi.key);
    }

    function etat(fixture: ComponentFixture<unknown>): string | null {
      return (
        racine(fixture)
          .querySelector('[data-testid="slide-reflection-etat"]')
          ?.getAttribute('data-etat') ?? null
      );
    }

    async function jusqua(
      fixture: ComponentFixture<unknown>,
      condition: () => boolean,
    ): Promise<void> {
      for (let essai = 0; essai < 200 && !condition(); essai += 1) {
        await new Promise((resoudre) => setTimeout(resoudre, 10));
        fixture.detectChanges();
      }
    }

    it('annonce l enregistrement quand le serveur accepte', async () => {
      const fixture = monterEnSeance('seance', `seance-ok-${Date.now()}`);

      garder(fixture, 'Comparer les bases.');
      await jusqua(fixture, () => etat(fixture) === 'enregistre');

      expect(racine(fixture).textContent).toContain('Réflexion enregistrée');
    });

    function zone(fixture: ComponentFixture<unknown>): HTMLTextAreaElement | null {
      return racine(fixture).querySelector('textarea');
    }

    function attendreFigee(fixture: ComponentFixture<unknown>, texte: string): void {
      expect(zone(fixture)?.value).toBe(texte);
      expect(zone(fixture)?.readOnly).toBeTrue();
      expect(racine(fixture).querySelector('.slide-reflection__save')).toBeNull();
    }

    it('garde la réflexion enregistrée affichée en lecture seule, sans bouton', async () => {
      const fixture = monterEnSeance('seance', `seance-figee-${Date.now()}`);

      garder(fixture, '  Comparer les bases.  ');
      await jusqua(fixture, () => etat(fixture) === 'enregistre');

      attendreFigee(fixture, 'Comparer les bases.');
    });

    it('retrouve la réflexion gardée, figée, après un retour sur l écran', async () => {
      const sessionId = `seance-retour-${Date.now()}`;
      const premiere = monterEnSeance('seance', sessionId);
      garder(premiere, 'Comparer les bases.');
      await jusqua(premiere, () => etat(premiere) === 'enregistre');
      premiere.destroy();

      const retour = monterEnSeance('seance', sessionId);

      attendreFigee(retour, 'Comparer les bases.');
    });

    it('retrouve la réflexion gardée, figée, après un rechargement, depuis l état servi', () => {
      const sessionId = `seance-rechargee-${Date.now()}`;
      TestBed.inject(ReponsesLibresService).restaurer(sessionId, [
        { activityId: 'reflexion-1', response: 'Gardée avant le rechargement.' },
      ]);

      const fixture = monterEnSeance('seance', sessionId);

      attendreFigee(fixture, 'Gardée avant le rechargement.');
    });

    it('hors ligne, fige aussi la réflexion gardée en file', async () => {
      formations.enregistrerReponseLibre.and.returnValue(
        throwError(() => new ReponseLibreRefusee('reseau', 0)),
      );
      const fixture = monterEnSeance('seance', `seance-figee-hors-ligne-${Date.now()}`);

      garder(fixture, 'Envoyée plus tard.');
      await jusqua(fixture, () => etat(fixture) === 'attente_reseau');

      attendreFigee(fixture, 'Envoyée plus tard.');
    });

    describe('sur les réflexions des cours servis', () => {
      it('trouve des réflexions dans les cours servis', () => {
        expect(REFLEXIONS_SERVIES.length).toBeGreaterThan(0);
      });

      for (const reflexion of REFLEXIONS_SERVIES) {
        it(`${reflexion.screenId} : fige la réflexion gardée et la rend après un retour sur l écran`, async () => {
          const sessionId = `seance-${reflexion.screenId}-${Date.now()}`;
          const premiere = monterEnSeance('seance', sessionId, reflexion);
          garder(premiere, 'Ma réflexion.');
          await jusqua(premiere, () => etat(premiere) === 'enregistre');

          attendreFigee(premiere, 'Ma réflexion.');
          premiere.destroy();
          attendreFigee(monterEnSeance('seance', sessionId, reflexion), 'Ma réflexion.');
        });
      }
    });

    it('laisse la réflexion modifiable et le bouton présent après un échec d enregistrement', async () => {
      formations.enregistrerReponseLibre.and.returnValue(
        throwError(() => new ReponseLibreRefusee('refusee', 400)),
      );
      const fixture = monterEnSeance('seance', `seance-echec-${Date.now()}`);

      garder(fixture, 'À renvoyer.');
      await jusqua(fixture, () => etat(fixture) === 'echec');

      expect(zone(fixture)?.readOnly).toBeFalse();
      expect(racine(fixture).querySelector('.slide-reflection__save')).not.toBeNull();
    });

    async function garderMalgreLeRefus(
      sessionId: string,
      refus: ReponseLibreRefusee,
      texte: string,
      etatAttendu: string,
    ): Promise<ReturnType<typeof monterEnSeance>> {
      formations.enregistrerReponseLibre.and.returnValue(throwError(() => refus));
      const fixture = monterEnSeance('seance', sessionId);

      garder(fixture, texte);
      await jusqua(fixture, () => etat(fixture) === etatAttendu);
      return fixture;
    }

    it('hors ligne, garde la reflexion en file et attend le reseau, puis l envoie a son retour', async () => {
      const sessionId = `seance-reseau-${Date.now()}`;
      const fixture = await garderMalgreLeRefus(
        sessionId,
        new ReponseLibreRefusee('reseau', 0),
        'Envoyée plus tard.',
        'attente_reseau',
      );

      expect(racine(fixture).textContent).toContain('En attente de réseau');
      expect(racine(fixture).textContent).not.toContain('Échec');
      expect(await clesEnAttente(sessionId)).toEqual([CLE(sessionId)]);

      formations.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
      window.dispatchEvent(new Event('online'));
      await jusqua(fixture, () => etat(fixture) === 'enregistre');

      expect(await clesEnAttente(sessionId)).toEqual([]);
    });

    it('limitee par la cadence du serveur, fige la reflexion en file et dit l attente commune, pas le reseau', async () => {
      const sessionId = `seance-limite-${Date.now()}`;
      const fixture = await garderMalgreLeRefus(
        sessionId,
        new ReponseLibreRefusee('reseau', 429, { minutes: 2 }),
        'Envoyée après l attente.',
        'attente_limite',
      );

      expect(
        racine(fixture).querySelector('[data-testid="slide-reflection-etat"]')?.textContent?.trim(),
      ).toBe(ATTENTE_COMMUNE);
      attendreFigee(fixture, 'Envoyée après l attente.');
      expect(await clesEnAttente(sessionId)).toEqual([CLE(sessionId)]);
    });

    function garderSurEcranNonServi(sessionId: string): Promise<ReturnType<typeof monterEnSeance>> {
      return garderMalgreLeRefus(
        sessionId,
        new ReponseLibreRefusee('ecran-non-servi', 404),
        'Trop tôt pour cet écran.',
        'ecran_non_servi',
      );
    }

    it('annonce le depart quand la reflexion gardee part depuis un autre relais', async () => {
      const sessionId = `seance-depart-ailleurs-${Date.now()}`;
      const fixture = await garderSurEcranNonServi(sessionId);

      formations.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
      await TestBed.inject(ReponsesLibresService).reprendre(sessionId, 'jeton-1');
      await jusqua(fixture, () => etat(fixture) === 'enregistre');

      expect(etat(fixture)).toBe('enregistre');
      expect(await clesEnAttente(sessionId)).toEqual([]);
    });

    it('sur un ecran pas encore servi, l annonce et garde la reflexion en file', async () => {
      const sessionId = `seance-ecran-non-servi-${Date.now()}`;
      const fixture = await garderSurEcranNonServi(sessionId);

      expect(racine(fixture).textContent).toContain('pas encore ouvert');
      expect(await clesEnAttente(sessionId)).toEqual([CLE(sessionId)]);
    });

    const REFUS: readonly (readonly [MotifRefusReponseLibre, number, string, string])[] = [
      ['seance-terminee', 409, 'seance_terminee', 'La séance est terminée'],
      ['seance-non-demarree', 409, 'seance_non_demarree', 'pas encore démarré'],
      ['refusee', 400, 'echec', 'Échec'],
    ];

    for (const [motif, statut, attendu, message] of REFUS) {
      it(`sur un refus ${motif}, l annonce et retire la reflexion de la file`, async () => {
        const sessionId = `seance-${motif}-${Date.now()}`;
        await enqueueFreeResponse({
          key: CLE(sessionId),
          sessionId,
          studentKey: cleEtudiante(),
          screenId: 'ecran-1',
          activityId: 'reflexion-1',
          response: 'Mise en file plus tôt.',
          dureeMs: 10,
        });
        const fixture = await garderMalgreLeRefus(
          sessionId,
          new ReponseLibreRefusee(motif, statut),
          'Refusée par le serveur.',
          attendu,
        );

        expect(etat(fixture)).toBe(attendu);
        expect(racine(fixture).textContent).toContain(message);
        expect(await clesEnAttente(sessionId)).toEqual([]);
      });
    }
  });

  it('en seance, envoie la reflexion au serveur avec l ecran et l activite', () => {
    const fixture = monterEnSeance('seance', 'seance-envoi');

    garder(fixture, '  On compare des parts de totaux différents.  ');

    expect(formations.enregistrerReponseLibre).toHaveBeenCalledOnceWith(
      'seance-envoi',
      'jeton-1',
      jasmine.objectContaining({
        screenId: 'ecran-1',
        activityId: 'reflexion-1',
        response: 'On compare des parts de totaux différents.',
      }),
    );
    expect(racine(fixture).querySelector('[data-testid="slide-reflection-apercu"]')).toBeNull();
  });

  it('en seance, envoie la duree de reflexion mesuree sur l horloge monotone quand l horloge du poste recule', () => {
    const horloges = horlogesDeSaisie();
    const fixture = monterEnSeance('seance', 'seance-duree');

    horloges.saisirPendant(20_000);
    garder(fixture, 'Une réflexion mesurée.');

    expect(formations.enregistrerReponseLibre).toHaveBeenCalledOnceWith(
      'seance-duree',
      'jeton-1',
      jasmine.objectContaining({ dureeMs: 20_000 }),
    );
  });
});
