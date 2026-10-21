const ESPACE_DES_MILLIERS = /(?<=\d) (?=\d{3}(?!\d))/g;
const ESPACE_AVANT_L_UNITE = /(?<=\d) (?=[€%])/g;
const ESPACE_FINE_INSECABLE = '\u202f';
const ESPACE_INSECABLE = '\u00a0';
const ABSENT = '—';
const LOCALE_SOURCE = 'fr';

const DECIMALES_AU_PLUS = 2;
const SIGNE_D_UN_ZERO = /^-(?=0([,.]0+)?\D*$)/;
const FORMATS_FRANCAIS = new Map<number | undefined, Intl.NumberFormat>();
const FORMATS_DE_PART = new Map<string, Intl.NumberFormat>();

function memorise<C>(
  formats: Map<C, Intl.NumberFormat>,
  cle: C,
  creer: () => Intl.NumberFormat,
): Intl.NumberFormat {
  const connu = formats.get(cle);
  if (connu !== undefined) {
    return connu;
  }
  const format = creer();
  formats.set(cle, format);
  return format;
}

export function enFrancais(valeur: number | undefined, decimales?: number): string {
  if (valeur === undefined || !Number.isFinite(valeur)) {
    return ABSENT;
  }
  return memorise(
    FORMATS_FRANCAIS,
    decimales,
    () =>
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimales ?? 0,
        maximumFractionDigits: decimales ?? DECIMALES_AU_PLUS,
      }),
  )
    .format(valeur)
    .replace(SIGNE_D_UN_ZERO, '');
}

export function lierLesNombres(texte: string): string {
  return texte
    .replace(ESPACE_DES_MILLIERS, ESPACE_FINE_INSECABLE)
    .replace(ESPACE_AVANT_L_UNITE, ESPACE_INSECABLE);
}

export function formaterPart(part: number, locale = $localize.locale ?? LOCALE_SOURCE): string {
  return Number.isFinite(part)
    ? memorise(
        FORMATS_DE_PART,
        locale,
        () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }),
      )
        .format(part)
        .replace(SIGNE_D_UN_ZERO, '')
    : ABSENT;
}
