import type express from 'express';
import type { SeoMetadataFile } from '../app/core/seo/seo-metadata.model';
import type { PublicationDeCours } from './cours-publication';
import { buildSitemapXml, type DynamicArticleSitemapEntry } from './seo-builders';

export interface DependancesDuSitemap {
  readonly lireMetadata: () => SeoMetadataFile | null;
  readonly lireArticles: () => Promise<readonly DynamicArticleSitemapEntry[]>;
  readonly lirePublicationsDeCours: () => Promise<readonly PublicationDeCours[]>;
  readonly baseUrlDe: (req: express.Request, defaut?: string) => string;
}

const CACHE_DU_SITEMAP = 'public, max-age=86400, s-maxage=86400';

export function routeDuSitemap(
  dependances: DependancesDuSitemap,
): (req: express.Request, res: express.Response) => Promise<void> {
  return async (req, res) => {
    const metadata = dependances.lireMetadata();
    if (metadata === null) {
      res.status(404).type('text/plain').send('Sitemap not available');
      return;
    }

    const baseUrl = dependances.baseUrlDe(req, metadata.site.baseUrl);
    const [articles, publications] = await Promise.all([
      dependances.lireArticles(),
      dependances.lirePublicationsDeCours(),
    ]);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', CACHE_DU_SITEMAP);
    res.send(buildSitemapXml(metadata, baseUrl, articles, publications));
  };
}
