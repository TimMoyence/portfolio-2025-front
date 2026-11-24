import { type Realisation, realisationDuSlug } from '../../app/features/projets/realisations.data';

export function buildRealisation(slug: string, surcharges: Partial<Realisation> = {}): Realisation {
  const trouvee = realisationDuSlug(slug);
  if (!trouvee) {
    throw new Error(`réalisation ${slug} absente`);
  }
  return { ...trouvee, ...surcharges };
}
