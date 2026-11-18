import { jouerLaTranche, lireLaTranche, specsDeLaTranche } from './tranche-de-la-suite';

describe('tranche de la suite Karma', () => {
  const specs = Array.from({ length: 11 }, (_, rang) => `spec-${rang}`);

  it('répartit les specs à tour de rôle, dans l ordre reçu', () => {
    expect(specsDeLaTranche(specs, { rang: 1, total: 4 })).toEqual(['spec-1', 'spec-5', 'spec-9']);
  });

  it('joue chaque spec dans une seule tranche, sans en perdre aucune', () => {
    const tranches = [0, 1, 2].map((rang) => specsDeLaTranche(specs, { rang, total: 3 }));

    expect(tranches.flat()).toEqual(jasmine.arrayWithExactContents(specs));
  });

  it('lit la tranche « rang/total » que pose le lanceur', () => {
    expect(lireLaTranche('2/6')).toEqual({ rang: 2, total: 6 });
  });

  it('joue toute la suite sans tranche', () => {
    expect(lireLaTranche(undefined)).toBeNull();
    expect(lireLaTranche('')).toBeNull();
  });

  describe('dans l environnement jasmine', () => {
    let rang = 0;
    const spec = (nom: string): jasmine.Spec =>
      ({ id: `spec${rang++}`, getFullName: () => nom }) as jasmine.Spec;
    const suite = (...children: (jasmine.Spec | jasmine.Suite)[]): jasmine.Suite =>
      ({ id: 'suite', children }) as unknown as jasmine.Suite;
    const specsDe = (noeud: jasmine.Spec | jasmine.Suite): jasmine.Spec[] =>
      'children' in noeud ? noeud.children.flatMap(specsDe) : [noeud];
    const retenues = (arbre: jasmine.Suite, tranche: string): string[] => {
      let filtre: jasmine.SpecFilter | undefined;
      const env = {
        topSuite: () => arbre,
        configure: (configuration: jasmine.Configuration) => {
          filtre = configuration.specFilter;
        },
      } as unknown as jasmine.Env;
      jouerLaTranche(env, tranche);
      return specsDe(arbre)
        .filter((retenue) => filtre?.(retenue) === true)
        .map((retenue) => retenue.getFullName());
    };

    it('joue chaque spec dans une seule tranche, même quand chaque processus les déclare dans un autre ordre', () => {
      const premier = suite(spec('a'), suite(spec('b'), spec('c')), spec('d'));
      const second = suite(suite(spec('b'), spec('a')), spec('d'), spec('c'));

      expect([...retenues(premier, '0/2'), ...retenues(second, '1/2')]).toEqual(
        jasmine.arrayWithExactContents(['a', 'b', 'c', 'd']),
      );
    });

    it('joue dans la même tranche les specs qui portent le même nom complet', () => {
      const arbre = suite(spec('a'), spec('b'), spec('a'));

      expect([retenues(arbre, '0/2'), retenues(arbre, '1/2')]).toEqual([['a', 'a'], ['b']]);
    });
  });

  it('laisse l environnement jasmine intact sans tranche', () => {
    const configure = jasmine.createSpy('configure');

    jouerLaTranche({ configure } as unknown as jasmine.Env, undefined);

    expect(configure).not.toHaveBeenCalled();
  });

  it('refuse une tranche hors de la suite, qui ne jouerait aucun test', () => {
    for (const lue of ['6/6', '-1/6', '0/0', 'a/b', '1', '1/2/3']) {
      expect(() => lireLaTranche(lue))
        .withContext(lue)
        .toThrowError(/tranche/);
    }
  });
});
