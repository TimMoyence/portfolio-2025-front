import { RenderMode } from '@angular/ssr';
import { serverRoutes } from '../app/app.routes.server';

const CLIENT_ONLY_ROUTE_PATTERNS: RegExp[] = serverRoutes
  .filter((route) => route.renderMode === RenderMode.Client)
  .map((route) => new RegExp(`^${route.path.replace(/:[A-Za-z]+/g, '[^/]+')}/?$`));

export const isClientOnlyRoute = (routePath: string): boolean => {
  const normalized = routePath.replace(/^\//, '');
  return CLIENT_ONLY_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
};
