const TEMOIN_XSS = '__xssDeclenche';

export const CHARGE_XSS = `<img src=x onerror="window.${TEMOIN_XSS}=1"><script>window.${TEMOIN_XSS}=2</script>`;

export function balisesInjectees(hote: ParentNode): number {
  return hote.querySelectorAll('img[onerror], script').length;
}

export function xssDeclenche(): boolean {
  return (window as unknown as Record<string, unknown>)[TEMOIN_XSS] !== undefined;
}
