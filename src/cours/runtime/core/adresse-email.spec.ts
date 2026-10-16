import { estUneAdresseEmail } from './adresse-email';

const ACCEPTEES = [
  'jean@exemple.fr',
  'Jean.Dupont+cours@exemple.co.uk',
  "o'neil@exemple.fr",
  'élève@lycée.fr',
  'jean@exemple.xn--p1ai',
  'jean@sous-domaine.exemple.fr',
  `${'a'.repeat(64)}@exemple.fr`,
  `jean@${'a'.repeat(63)}.fr`,
];

const REFUSEES = [
  '"jean dupont"@exemple.fr',
  '"jean"@exemple.fr',
  '"a\r\nBcc: x@y.fr"@exemple.fr',
  'jean@gmail',
  'jean@localhost',
  'jean.dupont@exemple',
  'jean@exemple.c',
  'jean@exemple.123',
  'jean@-exemple.fr',
  'jean@exemple-.fr',
  'jean@exe_mple.fr',
  'jean..dupont@exemple.fr',
  '.jean@exemple.fr',
  'jean.@exemple.fr',
  'jean@[127.0.0.1]',
  'jean@127.0.0.1',
  '',
  'jean',
  '@exemple.fr',
  'jean@@exemple.fr',
  'jean@ｅxemple.fr',
  'jean @exemple.fr',
  'jean@exemple.fr ',
  'Jean Dupont <jean@exemple.fr>',
  `${'a'.repeat(65)}@exemple.fr`,
  `jean@${'a'.repeat(64)}.fr`,
  `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.fr`,
];

const INVISIBLES_ET_ESPACES = [
  0x00a0, 0x2000, 0x200a, 0x200b, 0x2028, 0x2029, 0x202e, 0x202f, 0x3000, 0xfeff, 0xe000,
];

const REFUSEES_POUR_UN_CARACTERE_INVISIBLE = INVISIBLES_ET_ESPACES.flatMap((point) => {
  const caractere = String.fromCodePoint(point);
  return [
    { point, adresse: `jean${caractere}dupont@exemple.fr` },
    { point, adresse: `jean@exe${caractere}mple.fr` },
  ];
});

describe('estUneAdresseEmail', () => {
  for (const adresse of ACCEPTEES) {
    it(`accepte « ${adresse.slice(0, 40)} », comme IsEmail du back`, () => {
      expect(estUneAdresseEmail(adresse)).toBeTrue();
    });
  }

  for (const adresse of REFUSEES) {
    it(`refuse « ${adresse.slice(0, 40)} », comme IsEmail du back`, () => {
      expect(estUneAdresseEmail(adresse)).toBeFalse();
    });
  }

  for (const { point, adresse } of REFUSEES_POUR_UN_CARACTERE_INVISIBLE) {
    const lieu = adresse.startsWith('jean@') ? 'domaine' : 'partie locale';
    it(`refuse U+${point.toString(16).toUpperCase().padStart(4, '0')} dans la ${lieu}, comme AdresseEmail du back`, () => {
      expect(estUneAdresseEmail(adresse)).toBeFalse();
    });
  }
});
