export const documentCacheControlFor = (status: number): string => {
  if (status >= 500) return 'no-store';
  if (status === 404) return 'public, max-age=300, s-maxage=300';
  return 'public, max-age=3600, s-maxage=14400';
};
