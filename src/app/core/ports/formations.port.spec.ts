import { firstValueFrom } from 'rxjs';
import {
  buildEtatParticipant,
  buildSpacedQuestionPublique,
  buildStrategiePublique,
  buildSyntheseConcept,
  buildVerdictProduction,
  buildVerdictTentative,
  createFormationsPortStub,
} from '../../../testing/factories/formations.factory';
import type {
  FormationsPort,
  StrategiePublique,
  SyntheseConcept,
  VerdictProduction,
  VerdictTentative,
} from './formations.port';
import type { EtatParticipant } from '../../../cours/content/types';
import type { SpacedQuestionPublique } from '../../../cours/runtime/blocks/donnees-publiques';

const METHODES_DU_PORT = {
  ouvrirSeance: true,
  lireDeroule: true,
  lireSujet: true,
  demarrer: true,
  piloter: true,
  cloturer: true,
  lireResultats: true,
  exporterBilan: true,
  lireAnnotations: true,
  enregistrerAnnotation: true,
  lireReponsesLibres: true,
  lireGroupes: true,
  creerGroupe: true,
  renommerGroupe: true,
  affecterParticipant: true,
  retirerParticipantDuGroupe: true,
  lireParticipants: true,
  rejoindre: true,
  repondre: true,
  enregistrerReponseLibre: true,
  signalerIncidents: true,
  lireQuestionsDues: true,
  envoyerProduction: true,
  tenterEnigme: true,
  declarerJalon: true,
  lireRappels: true,
  envoyerDefi: true,
  lireStrategies: true,
  lireMonEtat: true,
  lireSyntheseRappels: true,
  evincerParticipant: true,
} satisfies Record<keyof FormationsPort, true>;

describe('createFormationsPortStub', () => {
  it('double chaque methode du port par un espion', () => {
    const port: FormationsPort = createFormationsPortStub();

    for (const methode of Object.keys(METHODES_DU_PORT) as (keyof FormationsPort)[]) {
      expect(jasmine.isSpy(port[methode])).withContext(methode).toBeTrue();
    }
  });

  it('rend par defaut une valeur typee construite par les factories pour chaque nouvelle methode', async () => {
    const port = createFormationsPortStub();
    const production: VerdictProduction = await firstValueFrom(
      port.envoyerProduction('seance-1', 'jeton-1', {
        questionId: 'b2-01-a4-feuille-canaux',
        valeur: { type: 'feuille', neSaitPas: true },
        dureeMs: 1000,
      }),
    );
    const tentative: VerdictTentative = await firstValueFrom(
      port.tenterEnigme('seance-1', 'jeton-1', 'b2-01-a6-coffre', {
        enigmeId: 'enigme-1',
        reponse: '142 920',
        dureeMs: 1000,
      }),
    );
    const rappels: { questions: readonly SpacedQuestionPublique[] } = await firstValueFrom(
      port.lireRappels('seance-1', 'jeton-1'),
    );
    const defi: { strategies: readonly StrategiePublique[] } = await firstValueFrom(
      port.envoyerDefi('seance-1', 'jeton-1', 'b2-01-a5-defi', { texte: 'Essai.', dureeMs: 1000 }),
    );
    const strategies: { strategies: readonly StrategiePublique[] } = await firstValueFrom(
      port.lireStrategies('seance-1', 'jeton-1', 'b2-01-a5-defi'),
    );
    const moi: EtatParticipant = await firstValueFrom(port.lireMonEtat('seance-1', 'jeton-1'));
    const synthese: { concepts: readonly SyntheseConcept[] } = await firstValueFrom(
      port.lireSyntheseRappels('seance-1'),
    );

    expect(production).toEqual(buildVerdictProduction());
    expect(tentative).toEqual(buildVerdictTentative());
    expect(rappels).toEqual({ questions: [buildSpacedQuestionPublique()] });
    expect(defi).toEqual({ strategies: [buildStrategiePublique()] });
    expect(strategies).toEqual({ strategies: [buildStrategiePublique()] });
    expect(moi).toEqual(buildEtatParticipant());
    expect(synthese).toEqual({ concepts: [buildSyntheseConcept()] });
  });

  it('acquitte sans valeur les commandes qui ne rendent rien', async () => {
    const port = createFormationsPortStub();

    expect(
      await Promise.all([
        firstValueFrom(port.declarerJalon('seance-1', 'jeton-1', 'b2-01-jalon-1', 'perdu')),
        firstValueFrom(port.evincerParticipant('seance-1', 'participant-1')),
      ]),
    ).toEqual([undefined, undefined]);
  });
});
