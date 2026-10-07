import { RenderMode } from '@angular/ssr';
import { serverRoutes } from '../app/app.routes.server';

const motifDeRoute = (chemin: string): RegExp =>
  new RegExp(`^${chemin.replace(/:[A-Za-z]+/g, '[^/]+')}/?$`);

const sansBarreInitiale = (routePath: string): string => routePath.replace(/^\//, '');

const CLIENT_ONLY_ROUTE_PATTERNS: RegExp[] = serverRoutes
  .filter((route) => route.renderMode === RenderMode.Client)
  .map((route) => motifDeRoute(route.path));

const ENTETES_DECLAREES = serverRoutes.flatMap(({ path, headers }) =>
  headers === undefined ? [] : [{ motif: motifDeRoute(path), headers }],
);

export const isClientOnlyRoute = (routePath: string): boolean => {
  const normalized = sansBarreInitiale(routePath);
  return CLIENT_ONLY_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const entetesDeLaRoute = (routePath: string): Readonly<Record<string, string>> => {
  const chemin = sansBarreInitiale(routePath);
  return ENTETES_DECLAREES.find(({ motif }) => motif.test(chemin))?.headers ?? {};
};
