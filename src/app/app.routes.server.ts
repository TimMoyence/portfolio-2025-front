import { RenderMode, type ServerRoute } from '@angular/ssr';
import { cheminDuCoursBts, COURS_BTS } from './core/config/cours-bts';

/**
 * Configuration des routes serveur pour le SSR/SSG Angular.
 *
 * Les routes protégées par un guard d'authentification ne peuvent PAS être
 * prérendues au build : pendant le prerender, l'AuthStateService n'a pas
 * accès au cookie de refresh HttpOnly, donc le guard redirige systématiquement vers /login
 * (ou /). Le fichier HTML prérendu contient alors le contenu de /login,
 * mais est sauvé à l'emplacement de la route d'origine — au reload,
 * l'utilisateur se retrouve avec un contenu obsolète.
 *
 * Ces routes sont donc forcées en mode Client : le navigateur reçoit une
 * coquille HTML minimale et le client Angular gère le routing après
 * hydratation, moment où le cookie de refresh peut restaurer la session.
 *
 */
const IMPRIME_HORS_DU_PROCESSUS_DE_SON_OUVREUR: Readonly<Record<string, string>> = {
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export const serverRoutes: ServerRoute[] = [
  { path: 'profil', renderMode: RenderMode.Client },
  { path: 'atelier', renderMode: RenderMode.Server },
  { path: 'atelier/**', renderMode: RenderMode.Server },
  { path: 'cours/rejoindre', renderMode: RenderMode.Client },
  { path: 'cours/presenter/:slug', renderMode: RenderMode.Client },
  {
    path: 'cours/presenter/:slug/livret',
    renderMode: RenderMode.Client,
    headers: IMPRIME_HORS_DU_PROCESSUS_DE_SON_OUVREUR,
  },
  { path: 'cours/presenter/:slug/scene/:sessionId', renderMode: RenderMode.Client },
  { path: 'cours/seance/:sessionId/synthese', renderMode: RenderMode.Client },

  {
    path: 'formations/ia-solopreneurs/toolkit/:token',
    renderMode: RenderMode.Server,
  },

  { path: 'projets', renderMode: RenderMode.Prerender },
  { path: 'articles', renderMode: RenderMode.Server },
  { path: 'articles/:slug', renderMode: RenderMode.Server },
  ...COURS_BTS.map((slug): ServerRoute => ({
    path: cheminDuCoursBts(slug),
    renderMode: RenderMode.Client,
  })),

  { path: '**', renderMode: RenderMode.Prerender },
];
