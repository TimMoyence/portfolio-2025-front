import { BORNES_D_UN_MESSAGE_DE_CONTACT, erreursDeLongueur } from './regles-de-saisie';

const SOURIRE = String.fromCodePoint(0x1f600);
const COEUR_EMOJI = String.fromCodePoint(0x2764, 0xfe0f);
const MAINS_JOINTES = String.fromCodePoint(0x1f64f);

describe('erreursDeLongueur', () => {
  it('juge la valeur rognée, celle que le back garde', () => {
    expect(erreursDeLongueur('  abc  ', { min: 2, max: 3 })).toBeNull();
    expect(erreursDeLongueur('Bonjour   ', BORNES_D_UN_MESSAGE_DE_CONTACT)).toEqual({
      minlength: { requiredLength: 10, actualLength: 7 },
    });
  });

  it('signale requis un texte fait de blancs quand un minimum est exigé', () => {
    expect(erreursDeLongueur(' \t ', { min: 1, max: 50 })).toEqual({ required: true });
    expect(erreursDeLongueur('', { min: 1, max: 50 })).toEqual({ required: true });
    expect(erreursDeLongueur('   ', { min: 0, max: 30 })).toBeNull();
  });

  it('compte en caractères, comme la colonne varchar du back, jamais en unités UTF-16', () => {
    expect(erreursDeLongueur(SOURIRE.repeat(3), { min: 1, max: 3 })).toBeNull();
    expect(erreursDeLongueur(SOURIRE.repeat(4), { min: 1, max: 3 })).toEqual({
      maxlength: { requiredLength: 3, actualLength: 4 },
    });
    expect(
      erreursDeLongueur(`Merci ${MAINS_JOINTES}${MAINS_JOINTES}`, BORNES_D_UN_MESSAGE_DE_CONTACT),
    ).toEqual({
      minlength: { requiredLength: 10, actualLength: 8 },
    });
  });

  it('compte le sélecteur de variante d un emoji comme un caractère, comme varchar', () => {
    expect(erreursDeLongueur(COEUR_EMOJI.repeat(2), { min: 1, max: 3 })).toEqual({
      maxlength: { requiredLength: 3, actualLength: 4 },
    });
  });

  it('juge brute une saisie que le back ne rogne pas', () => {
    expect(erreursDeLongueur('  ab', { min: 1, max: 3, brute: true })).toEqual({
      maxlength: { requiredLength: 3, actualLength: 4 },
    });
    expect(erreursDeLongueur('   ', { min: 1, max: 3, brute: true })).toBeNull();
  });
});
