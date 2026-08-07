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
 * Solution : forcer le mode Client pour les routes /atelier/{*}/app et /profil,
 * ce qui envoie une coquille HTML minimale au navigateur et laisse le client
 * Angular gérer le routing après hydratation (moment où le token localStorage
 * est disponible).
 *
 * Les pages publiques de présentation des ateliers (/atelier/meteo,
 * /atelier/sebastian) restent prérendues — elles servent
 * de landing pages SEO pour chaque mini-app.
 */
export const serverRoutes: ServerRoute[] = [
  // Routes protégées par authGuard — rendu client uniquement
  { path: 'profil', renderMode: RenderMode.Client },
  { path: 'atelier/meteo/app', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/dashboard', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/rapports', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/badges', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/historique', renderMode: RenderMode.Client },
  { path: 'atelier/sebastian/app/objectifs', renderMode: RenderMode.Client },

  // Toolkit privé avec token dynamique — rendu serveur on-demand
  {
    path: 'formations/ia-solopreneurs/toolkit/:token',
    renderMode: RenderMode.Server,
  },

  // Page publique des réalisations — prérendue (landing SEO statique).
  // Déjà couverte par le catch-all `**` ci-dessous ; entrée explicite pour
  // rendre l'intention claire au build.
  { path: 'projets', renderMode: RenderMode.Prerender },

  // Hub L'Atelier — landing SEO statique (démos simulées, aucun guard).
  // Déjà couverte par `**` ; entrée explicite pour rendre l'intention claire.
  { path: 'atelier', renderMode: RenderMode.Prerender },

  // Routes publiques (incluant les présentations atelier) — prérendues.
  // Les formations sont enregistrees en routes STATIQUES par slug dans
  // `app.routes.ts` (composants slide-driven dedies), donc capturees ici.
  { path: '**', renderMode: RenderMode.Prerender },
];
