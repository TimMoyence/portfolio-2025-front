/**
 * Les routes listees ici DOIVENT correspondre a celles marquees
 * `RenderMode.Client` dans `src/app/app.routes.server.ts`.
 */
const CLIENT_ONLY_ROUTE_PATTERNS: RegExp[] = [/^profil\/?$/];

export const isClientOnlyRoute = (routePath: string): boolean => {
  const normalized = routePath.replace(/^\//, '');
  return CLIENT_ONLY_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
};
