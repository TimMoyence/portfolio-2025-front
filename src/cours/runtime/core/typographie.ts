const ESPACE_DANS_UN_NOMBRE = /(?<=\d) (?=\d{3}(?!\d)|[€%])/g;

export function lierLesNombres(texte: string): string {
  return texte.replace(ESPACE_DANS_UN_NOMBRE, ' ');
}
