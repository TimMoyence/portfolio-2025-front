import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { createFormationsPortStub } from '../../../../testing/factories/formations.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, ReponseLibreRefusee } from '../../../core/ports/formations.port';
import { clearIdentity, readIdentity, saveIdentity } from '../../../../cours/runtime/core/identity';
import { enqueue, pending } from '../../../../cours/runtime/core/queue';
import {
  buildReponseLibreEnFile,
  reponsesLibresEnFile,
  viderLaFileDEnvois,
} from '../../../../testing/factories/queue.factory';
import { saturationDuStockage } from '../../../../testing/sans-stockage';
import { cleDeReponseLibre, EnvoisDeSeanceService } from './envois-de-seance.service';

const cleCourante = (): string => readIdentity()?.studentKey ?? '';

const SESSION = 'seance-libres-1';
const JETON = 'jeton-participant';
const REPONSE = {
  screenId: 'b2-01-sortie',
  activityId: 'B-SORTIE-09',
  response: '  Le taux mensuel reste flou  ',
  dureeMs: 4200,
};

describe('EnvoisDeSeanceService', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let service: EnvoisDeSeanceService;

  beforeEach(async () => {
    viderLaFileDEnvois();
    clearIdentity();
    saveIdentity({ prenom: 'Anais', nom: 'Rivet', email: 'anais@example.com' });
    port = createFormationsPortStub();
    await setupTestBed({
      providers: [{ provide: FORMATIONS_PORT, useValue: port }],
    }).compileComponents();
    service = TestBed.inject(EnvoisDeSeanceService);
  });

  afterEach(() => {
    clearIdentity();
  });

  it('n envoie pas un texte vide', async () => {
    expect(await service.envoyer(SESSION, JETON, { ...REPONSE, response: '   ' })).toBe('vide');
    expect(port.enregistrerReponseLibre).not.toHaveBeenCalled();
  });

  it('envoie le texte nettoye avec le jeton du participant', async () => {
    expect(await service.envoyer(SESSION, JETON, REPONSE)).toBe('enregistre');
    expect(port.enregistrerReponseLibre).toHaveBeenCalledOnceWith(SESSION, JETON, {
      screenId: 'b2-01-sortie',
      activityId: 'B-SORTIE-09',
      response: 'Le taux mensuel reste flou',
      dureeMs: 4200,
    });
  });

  it('traduit un refus definitif sans le garder en file', async () => {
    port.enregistrerReponseLibre.and.returnValue(
      throwError(() => new ReponseLibreRefusee('seance-terminee', 409)),
    );
    expect(await service.envoyer(SESSION, JETON, REPONSE)).toBe('seance_terminee');
    expect(reponsesLibresEnFile(SESSION, cleCourante())).toEqual([]);
  });

  it('garde en file un texte refuse parce que l ecran n est pas encore servi', async () => {
    const seance = `${SESSION}-ecran-non-servi`;
    port.enregistrerReponseLibre.and.returnValue(
      throwError(() => new ReponseLibreRefusee('ecran-non-servi', 404)),
    );

    expect(await service.envoyer(seance, JETON, REPONSE)).toBe('ecran_non_servi');
    expect(reponsesLibresEnFile(seance, cleCourante()).map((envoi) => envoi.questionId)).toEqual([
      'B-SORTIE-09',
    ]);

    await attendreLaRepriseEnregistree(seance);
  });

  it('garde en file un texte bloque par le reseau et le renvoie a la reprise', async () => {
    port.enregistrerReponseLibre.and.returnValue(throwError(() => new Error('reseau coupe')));

    expect(await service.envoyer(SESSION, JETON, REPONSE)).toBe('attente_reseau');
    await attendreLaRepriseEnregistree(SESSION);
  });

  it('garde en file un texte limite par la cadence du serveur, en attente de la limite, puis le renvoie a la reprise', async () => {
    const seance = `${SESSION}-limite`;
    const cle = cleDeReponseLibre(seance, REPONSE.screenId, REPONSE.activityId);
    port.enregistrerReponseLibre.and.returnValue(
      throwError(() => new ReponseLibreRefusee('reseau', 429, { minutes: 2 })),
    );

    expect(await service.envoyer(seance, JETON, REPONSE)).toBe('attente_limite');
    expect(service.etatsDesEnvois().get(cle)).toBe('attente_limite');

    await attendreLaRepriseEnregistree(seance);
    expect(service.etatsDesEnvois().get(cle)).toBe('enregistre');
  });

  it('refuse de facon visible une reflexion que le poste ne peut pas garder, au lieu de la dire gardee', async () => {
    port.enregistrerReponseLibre.and.returnValue(throwError(() => new Error('reseau coupe')));
    spyOn(globalThis.localStorage, 'setItem').and.throwError(saturationDuStockage());

    expect(await service.envoyer(SESSION, JETON, REPONSE)).toBe('echec');
    expect(service.fileRefusee()).toBeTrue();
    expect(service.texteGarde(SESSION, REPONSE.activityId)).toBeNull();
  });

  it('purge a la jonction les reflexions gardees pour une autre seance, comme les votes', () => {
    enqueue(buildReponseLibreEnFile({ sessionId: 'seance-passee', studentKey: cleCourante() }));

    service.ouvrir(SESSION);

    expect(reponsesLibresEnFile('seance-passee', cleCourante())).toEqual([]);
    expect(service.fileRefusee()).toBeFalse();
  });

  it('repasse dans une seule file les votes et les reflexions de la seance', async () => {
    port.enregistrerReponseLibre.and.returnValue(throwError(() => new Error('reseau coupe')));
    await service.envoyer(SESSION, JETON, REPONSE);
    expect(
      service.mettreEnFile({
        nature: 'reponse',
        sessionId: SESSION,
        questionId: 'Q-1',
        valeur: 'b',
        dureeMs: 0,
      }),
    ).toBeTrue();
    port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
    const renvoyes: string[] = [];

    await service.reprendre(SESSION, JETON, (envoi) => {
      renvoyes.push(envoi.questionId);
      return true;
    });

    expect(renvoyes).toEqual(['Q-1']);
    expect(port.enregistrerReponseLibre).toHaveBeenCalledTimes(2);
    expect(pending()).toEqual([]);
  });

  async function attendreLaRepriseEnregistree(seance: string): Promise<void> {
    port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
    const reprise = await service.reprendre(seance, JETON);

    expect(reprise.get(cleDeReponseLibre(seance, 'b2-01-sortie', 'B-SORTIE-09'))).toBe(
      'enregistre',
    );
    expect(reponsesLibresEnFile(seance, cleCourante())).toEqual([]);
  }

  describe('D-19 · chaque enregistrement reussi se signale au poste', () => {
    const AUTRE_REFLEXION = { ...REPONSE, activityId: 'B-SORTIE-10' };

    function compterLesReussites(): () => number {
      let vues = 0;
      service.envoisReussis.subscribe(() => {
        vues += 1;
      });
      return () => vues;
    }

    it('signale un envoi enregistre, et pas un envoi retenu par la cadence', async () => {
      const reussites = compterLesReussites();
      port.enregistrerReponseLibre.and.returnValues(
        throwError(() => new ReponseLibreRefusee('reseau', 429, { minutes: 2 })),
        of({ status: 'enregistre' }),
      );

      await service.envoyer(`${SESSION}-signal-envoi`, JETON, REPONSE);
      const apresLeRefus = reussites();
      await service.envoyer(`${SESSION}-signal-envoi`, JETON, AUTRE_REFLEXION);

      expect([apresLeRefus, reussites()]).toEqual([0, 1]);
    });

    it('signale un envoi enregistre par la reprise', async () => {
      const seance = `${SESSION}-signal-reprise`;
      port.enregistrerReponseLibre.and.returnValue(throwError(() => new Error('reseau coupe')));
      await service.envoyer(seance, JETON, REPONSE);
      const reussites = compterLesReussites();

      await attendreLaRepriseEnregistree(seance);

      expect(reussites()).toBe(1);
    });

    it('n envoie qu une fois chaque reflexion en file sous deux reprises simultanees', async () => {
      const seance = `${SESSION}-reprises-simultanees`;
      port.enregistrerReponseLibre.and.returnValue(throwError(() => new Error('reseau coupe')));
      await service.envoyer(seance, JETON, REPONSE);
      await service.envoyer(seance, JETON, AUTRE_REFLEXION);
      port.enregistrerReponseLibre.calls.reset();
      port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));

      await Promise.all([service.reprendre(seance, JETON), service.reprendre(seance, JETON)]);

      expect(
        port.enregistrerReponseLibre.calls.allArgs().map(([, , reponse]) => reponse.activityId),
      ).toEqual(['B-SORTIE-09', 'B-SORTIE-10']);
    });
  });

  describe('poste partage entre deux etudiants', () => {
    const ECRAN_COMMUN = { ...REPONSE, response: 'texte de A' };

    async function garderHorsLigne(seance: string, texte: string): Promise<void> {
      port.enregistrerReponseLibre.and.returnValue(throwError(() => new Error('reseau coupe')));
      expect(await service.envoyer(seance, JETON, { ...ECRAN_COMMUN, response: texte })).toBe(
        'attente_reseau',
      );
    }

    async function textesEnFile(seance: string, cle: string): Promise<string[]> {
      return reponsesLibresEnFile(seance, cle).map((envoi) => envoi.valeur as string);
    }

    async function passerDeAABilal(seance: string): Promise<string> {
      await garderHorsLigne(seance, 'texte de A');
      const cleDeA = cleCourante();
      saveIdentity({ prenom: 'Bilal', nom: 'Nour', email: 'bilal@example.com' });
      return cleDeA;
    }

    it('rend a A sa reflexion en file quand il recharge sa page en pleine seance', async () => {
      const seance = `${SESSION}-reprise-de-a`;
      await garderHorsLigne(seance, 'texte de A');

      await attendreLaRepriseEnregistree(seance);
    });

    it('ne renvoie pas sous le jeton de B la reflexion gardee par A', async () => {
      const seance = `${SESSION}-poste-partage`;
      const cleDeA = await passerDeAABilal(seance);

      port.enregistrerReponseLibre.calls.reset();
      port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
      const reprise = await service.reprendre(seance, JETON);

      expect(port.enregistrerReponseLibre).not.toHaveBeenCalled();
      expect(reprise.size).toBe(0);
      expect(await textesEnFile(seance, cleDeA)).toEqual(['texte de A']);
    });

    it('ne fait pas ecraser la reflexion de A par celle de B sur le meme ecran', async () => {
      const seance = `${SESSION}-ecrasement`;
      const cleDeA = await passerDeAABilal(seance);

      await garderHorsLigne(seance, 'texte de B');
      const cleDeB = cleCourante();

      expect(cleDeB).not.toBe(cleDeA);
      expect(await textesEnFile(seance, cleDeA)).toEqual(['texte de A']);
      expect(await textesEnFile(seance, cleDeB)).toEqual(['texte de B']);
    });
  });
});
