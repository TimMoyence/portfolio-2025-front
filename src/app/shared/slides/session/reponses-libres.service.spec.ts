import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { createFormationsPortStub } from '../../../../testing/factories/formations.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT, ReponseLibreRefusee } from '../../../core/ports/formations.port';
import { clearIdentity, readIdentity, saveIdentity } from '../../../../cours/runtime/core/identity';
import { pendingFreeResponses } from '../interactions/slide-reflection/free-response.queue';
import { cleDeReponseLibre, ReponsesLibresService } from './reponses-libres.service';

const cleCourante = (): string => readIdentity()?.studentKey ?? '';

const SESSION = 'seance-libres-1';
const JETON = 'jeton-participant';
const REPONSE = {
  screenId: 'b2-01-sortie',
  activityId: 'B-SORTIE-09',
  response: '  Le taux mensuel reste flou  ',
  dureeMs: 4200,
};

describe('ReponsesLibresService', () => {
  let port: jasmine.SpyObj<FormationsPort>;
  let service: ReponsesLibresService;

  beforeEach(async () => {
    clearIdentity();
    saveIdentity({ prenom: 'Anais', nom: 'Rivet', email: 'anais@example.com' });
    port = createFormationsPortStub();
    await setupTestBed({
      providers: [{ provide: FORMATIONS_PORT, useValue: port }],
    }).compileComponents();
    service = TestBed.inject(ReponsesLibresService);
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
    expect(await pendingFreeResponses(SESSION, cleCourante())).toEqual([]);
  });

  it('garde en file un texte refuse parce que l ecran n est pas encore servi', async () => {
    const seance = `${SESSION}-ecran-non-servi`;
    port.enregistrerReponseLibre.and.returnValue(
      throwError(() => new ReponseLibreRefusee('ecran-non-servi', 404)),
    );

    expect(await service.envoyer(seance, JETON, REPONSE)).toBe('ecran_non_servi');
    expect(
      (await pendingFreeResponses(seance, cleCourante())).map((envoi) => envoi.activityId),
    ).toEqual(['B-SORTIE-09']);

    port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
    const reprise = await service.reprendre(seance, JETON);

    expect(reprise.get(cleDeReponseLibre(seance, 'b2-01-sortie', 'B-SORTIE-09'))).toBe(
      'enregistre',
    );
    expect(await pendingFreeResponses(seance, cleCourante())).toEqual([]);
  });

  it('garde en file un texte bloque par le reseau et le renvoie a la reprise', async () => {
    port.enregistrerReponseLibre.and.returnValues(
      throwError(() => new Error('reseau coupe')),
      of({ status: 'enregistre' }),
    );

    expect(await service.envoyer(SESSION, JETON, REPONSE)).toBe('attente_reseau');
    const reprise = await service.reprendre(SESSION, JETON);

    expect(reprise.get(cleDeReponseLibre(SESSION, 'b2-01-sortie', 'B-SORTIE-09'))).toBe(
      'enregistre',
    );
    expect(await pendingFreeResponses(SESSION, cleCourante())).toEqual([]);
  });

  describe('poste partage entre deux etudiants', () => {
    const ECRAN_COMMUN = { ...REPONSE, response: 'texte de A' };

    async function garderHorsLigne(seance: string, texte: string): Promise<void> {
      port.enregistrerReponseLibre.and.returnValue(throwError(() => new Error('reseau coupe')));
      expect(await service.envoyer(seance, JETON, { ...ECRAN_COMMUN, response: texte })).toBe(
        'attente_reseau',
      );
    }

    it('rend a A sa reflexion en file quand il recharge sa page en pleine seance', async () => {
      const seance = `${SESSION}-reprise-de-a`;
      await garderHorsLigne(seance, 'texte de A');
      const cleDeA = cleCourante();

      port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
      const reprise = await service.reprendre(seance, JETON);

      expect(reprise.get(cleDeReponseLibre(seance, 'b2-01-sortie', 'B-SORTIE-09'))).toBe(
        'enregistre',
      );
      expect(await pendingFreeResponses(seance, cleDeA)).toEqual([]);
    });

    it('ne renvoie pas sous le jeton de B la reflexion gardee par A', async () => {
      const seance = `${SESSION}-poste-partage`;
      await garderHorsLigne(seance, 'texte de A');
      const cleDeA = cleCourante();

      saveIdentity({ prenom: 'Bilal', nom: 'Nour', email: 'bilal@example.com' });
      port.enregistrerReponseLibre.calls.reset();
      port.enregistrerReponseLibre.and.returnValue(of({ status: 'enregistre' }));
      const reprise = await service.reprendre(seance, JETON);

      expect(port.enregistrerReponseLibre).not.toHaveBeenCalled();
      expect(reprise.size).toBe(0);
      expect((await pendingFreeResponses(seance, cleDeA)).map((envoi) => envoi.response)).toEqual([
        'texte de A',
      ]);
    });

    it('ne fait pas ecraser la reflexion de A par celle de B sur le meme ecran', async () => {
      const seance = `${SESSION}-ecrasement`;
      await garderHorsLigne(seance, 'texte de A');
      const cleDeA = cleCourante();

      saveIdentity({ prenom: 'Bilal', nom: 'Nour', email: 'bilal@example.com' });
      await garderHorsLigne(seance, 'texte de B');
      const cleDeB = cleCourante();

      expect(cleDeB).not.toBe(cleDeA);
      expect((await pendingFreeResponses(seance, cleDeA)).map((envoi) => envoi.response)).toEqual([
        'texte de A',
      ]);
      expect((await pendingFreeResponses(seance, cleDeB)).map((envoi) => envoi.response)).toEqual([
        'texte de B',
      ]);
    });
  });
});
