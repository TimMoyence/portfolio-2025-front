export function lastmodsDuSitemap(xml: string | null): string[] {
  return Array.from((xml ?? '').matchAll(/<lastmod>([^<]+)<\/lastmod>/g), ([, date]) => date);
}

export function lastmodDeLaPage(xml: string | null, chemin: string): string | null {
  const entree = new RegExp(`<loc>[^<]*${chemin}</loc>[\\s\\S]*?<lastmod>([^<]+)</lastmod>`).exec(
    xml ?? '',
  );
  return entree === null ? null : entree[1];
}
