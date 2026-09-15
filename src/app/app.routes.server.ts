import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Configuration des routes serveur pour le SSR/SSG Angular.
 *
 * Les routes protégées par un guard d'authentification ne peuvent PAS être
 * prérendues au build : pendant le prerender, l'AuthStateService n'a pas
 * accès au localStorage, donc le guard redirige systématiquement vers /login
 * (ou /). Le fichier HTML prérendu contient alors le contenu de /login,
 * mais est sauvé à l'emplacement de la route d'origine — au reload,
 * l'utilisateur se retrouve avec un contenu obsolète.
 *
 * Ces routes sont donc forcées en mode Client : le navigateur reçoit une
 * coquille HTML minimale et le client Angular gère le routing après
 * hydratation, moment où le token localStorage est disponible.
 *
 * Les routes publiques de l'ancien Atelier redirigent désormais vers
 * /projets. Les applications privées restent côté client et protégées.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'profil', renderMode: RenderMode.Client },
  { path: 'atelier/meteo/app', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/dashboard', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/rapports', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/badges', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/historique', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/objectifs', renderMode: RenderMode.Client },
  { path: 'cours/rejoindre', renderMode: RenderMode.Client },
  { path: 'cours/seance/:sessionId/synthese', renderMode: RenderMode.Client },

  {
    path: 'formations/ia-solopreneurs/toolkit/:token',
    renderMode: RenderMode.Server,
  },

  { path: 'projets', renderMode: RenderMode.Prerender },
  { path: 'articles', renderMode: RenderMode.Server },
  { path: 'articles/:slug', renderMode: RenderMode.Server },

  // Routes publiques — prérendues.
  // Les formations sont enregistrees en routes STATIQUES par slug dans
  // `app.routes.ts` (composants slide-driven dedies), donc capturees ici.
  { path: '**', renderMode: RenderMode.Prerender },
];
