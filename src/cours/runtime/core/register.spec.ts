import { BLOCS, registerCoursBlocks, resetCoursBlocksRegistration } from './register';

const NOM_BRIQUE_SOCLE = 'fp-vote';

interface RegistreFactice {
  definitions: Map<string, CustomElementConstructor>;
  restaurer: () => void;
}

function installerRegistreFactice(
  preexistantes: Readonly<Record<string, CustomElementConstructor>> = {},
): RegistreFactice {
  const descripteurOriginal = Object.getOwnPropertyDescriptor(globalThis, 'customElements');
  const definitions = new Map<string, CustomElementConstructor>(Object.entries(preexistantes));
  const factice = {
    get: (nom: string) => definitions.get(nom),
    define: (nom: string, constructeur: CustomElementConstructor) => {
      if (definitions.has(nom)) {
        throw new Error(`${nom} est deja enregistre`);
      }
      definitions.set(nom, constructeur);
    },
  } as unknown as CustomElementRegistry;
  Object.defineProperty(globalThis, 'customElements', { value: factice, configurable: true });
  return {
    definitions,
    restaurer: () => {
      if (descripteurOriginal) {
        Object.defineProperty(globalThis, 'customElements', descripteurOriginal);
      }
    },
  };
}

describe('registerCoursBlocks', () => {
  let registre: RegistreFactice;

  beforeEach(() => {
    resetCoursBlocksRegistration();
    registre = installerRegistreFactice();
  });

  afterEach(() => {
    registre.restaurer();
  });

  it('declare chaque brique une seule fois dans la table', () => {
    const noms = BLOCS.map((bloc) => bloc.nom);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it('definit tous les noms de la table', async () => {
    await registerCoursBlocks();
    expect(registre.definitions.has(NOM_BRIQUE_SOCLE))
      .withContext(`element manquant: ${NOM_BRIQUE_SOCLE}`)
      .toBe(true);
  });

  it('un second appel ne redefinit rien', async () => {
    await registerCoursBlocks();
    const premiere = registre.definitions.get(NOM_BRIQUE_SOCLE);
    await registerCoursBlocks();
    expect(registre.definitions.get(NOM_BRIQUE_SOCLE)).toBe(premiere);
  });

  it('un nom deja pris dans customElements n est pas redefini', async () => {
    const preexistante = class extends HTMLElement {};
    registre.restaurer();
    registre = installerRegistreFactice({ [NOM_BRIQUE_SOCLE]: preexistante });
    await registerCoursBlocks();
    expect(registre.definitions.get(NOM_BRIQUE_SOCLE)).toBe(preexistante);
  });
});
