import { sousHorlogeSimulee } from '../../../testing/horloge-simulee';
import { Battement, SECONDE_MS } from './battement';

interface CasDeBattement {
  readonly titre: string;
  readonly jouer: (battement: Battement, avancer: (duree: number) => void) => void;
  readonly battements: number;
}

const CAS: readonly CasDeBattement[] = [
  {
    titre: 'bat une fois par seconde une fois demarre',
    jouer: (battement, avancer) => {
      battement.demarrer();
      avancer(SECONDE_MS * 3);
    },
    battements: 3,
  },
  {
    titre: 'ne double pas la cadence quand on le demarre deux fois',
    jouer: (battement, avancer) => {
      battement.demarrer();
      battement.demarrer();
      avancer(SECONDE_MS);
    },
    battements: 1,
  },
  {
    titre: 'se tait apres l arret et peut repartir',
    jouer: (battement, avancer) => {
      battement.demarrer();
      battement.arreter();
      battement.arreter();
      avancer(SECONDE_MS * 2);
      battement.demarrer();
      avancer(SECONDE_MS);
    },
    battements: 1,
  },
];

describe('Battement', () => {
  sousHorlogeSimulee();

  for (const { titre, jouer, battements } of CAS) {
    it(titre, () => {
      const battre = jasmine.createSpy('battre');

      jouer(new Battement(battre), (duree) => jasmine.clock().tick(duree));

      expect(battre).toHaveBeenCalledTimes(battements);
    });
  }
});
