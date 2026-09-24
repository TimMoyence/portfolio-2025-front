import { Battement, SECONDE_MS } from './battement';

describe('Battement', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('bat une fois par seconde une fois demarre', () => {
    const battre = jasmine.createSpy('battre');
    const battement = new Battement(battre);

    battement.demarrer();
    jasmine.clock().tick(SECONDE_MS * 3);

    expect(battre).toHaveBeenCalledTimes(3);
  });

  it('ne double pas la cadence quand on le demarre deux fois', () => {
    const battre = jasmine.createSpy('battre');
    const battement = new Battement(battre);

    battement.demarrer();
    battement.demarrer();
    jasmine.clock().tick(SECONDE_MS);

    expect(battre).toHaveBeenCalledTimes(1);
  });

  it('se tait apres l arret et peut repartir', () => {
    const battre = jasmine.createSpy('battre');
    const battement = new Battement(battre);

    battement.demarrer();
    battement.arreter();
    battement.arreter();
    jasmine.clock().tick(SECONDE_MS * 2);
    battement.demarrer();
    jasmine.clock().tick(SECONDE_MS);

    expect(battre).toHaveBeenCalledTimes(1);
  });
});
