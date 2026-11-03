import fs from 'node:fs';
import { resolve } from 'node:path';

/**
 * Detection et service de la coquille CSR pour les routes qui doivent etre
 * rendues cote client uniquement. Pour ces routes, le SSR classique redirige
 * vers /login (le guard ne peut pas utiliser le cookie de refresh HttpOnly cote serveur), ce qui
 * casse le reload. On sert a la place la coquille CSR (index.csr.html) :
 * un HTML minimal avec les scripts Angular, qui laisse le client gerer le
 * routing apres hydratation. Les routes concernees sont decidees par
 * `isClientOnlyRoute` (`./routes-client`).
 */

export const loadCsrShell = (locale: string | null, browserDistFolder: string): string | null => {
  const candidates = [
    locale ? resolve(browserDistFolder, locale, 'index.csr.html') : null,
    resolve(browserDistFolder, 'index.csr.html'),
  ].filter((p): p is string => p !== null);

  for (const candidate of candidates) {
    if (candidate.startsWith(browserDistFolder) && fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf-8');
    }
  }
  return null;
};
