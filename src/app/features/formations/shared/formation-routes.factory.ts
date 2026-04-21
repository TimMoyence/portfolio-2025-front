import type { Route } from "@angular/router";
import { publishedFormations } from "./formations.registry";

/**
 * Genere la liste des routes statiques pour chaque formation publiee.
 *
 * Le prerender parametre Angular 19.2 (`getPrerenderParams` + route
 * `formations/:slug`) presente un bug silencieux en presence d'i18n
 * (issue upstream `angular/angular-cli#29587`). Le crawler de prerender
 * n'appelle pas `getPrerenderParams` et les routes parametrees ne sont
 * jamais materialisees en HTML. On neutralise la regression en generant
 * une route statique par slug depuis la registry : le crawler decouvre
 * la route exacte via `RouterLink` et la prerend proprement.
 *
 * Chaque route transmet `data.formationSlug` au `FormationPageComponent`
 * — le composant resout la config via la registry sans depender de
 * `paramMap`. La DX reste identique pour ajouter une formation : creer
 * `{slug}.config.ts`, enregistrer dans la registry, rebuild.
 */
export const buildFormationRoutes = (): Route[] =>
  publishedFormations().map((config) => ({
    path: `formations/${config.slug}`,
    loadComponent: () =>
      import("./formation-page.component").then(
        (m) => m.FormationPageComponent,
      ),
    data: {
      seoKey: `formations-${config.slug}`,
      formationSlug: config.slug,
    },
  }));
