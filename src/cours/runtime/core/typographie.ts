const ESPACE_DANS_UN_NOMBRE = /(?<=\d) (?=\d{3}(?!\d)|[€%])/g;

const DECIMALES_AU_PLUS = 2;
const SIGNE_D_UN_ZERO = /^-(?=0(,0+)?$)/;
const FORMATS_FRANCAIS = new Map<number | undefined, Intl.NumberFormat>();

function formatFrancais(decimales: number | undefined): Intl.NumberFormat {
  const connu = FORMATS_FRANCAIS.get(decimales);
  if (connu !== undefined) {
    return connu;
  }
  const format = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales ?? 0,
    maximumFractionDigits: decimales ?? DECIMALES_AU_PLUS,
  });
  FORMATS_FRANCAIS.set(decimales, format);
  return format;
}

export function enFrancais(valeur: number | undefined, decimales?: number): string {
  if (valeur === undefined || !Number.isFinite(valeur)) {
    return '—';
  }
  return formatFrancais(decimales).format(valeur).replace(SIGNE_D_UN_ZERO, '');
}

export function lierLesNombres(texte: string): string {
  return texte.replace(ESPACE_DANS_UN_NOMBRE, ' ');
}
