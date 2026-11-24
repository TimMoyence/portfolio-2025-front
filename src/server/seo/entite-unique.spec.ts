import { METADONNEES_DU_SITE } from '../../app/core/seo/site-servi';
import { type BlocJsonLd, jsonLdDeLaPage } from '../../app/core/seo/json-ld';
import { pagesIndexables } from '../../app/core/seo/pages/pages-seo';

const ORGANISATION = { '@id': 'https://asilidesign.fr/#organization' };
const TYPES_DES_ENTITES = new Set([
  'Organization',
  'LocalBusiness',
  'ProfessionalService',
  'Person',
]);
const CARTE =
  'https://www.google.com/maps/place/Allée+Serr,+33100+Bordeaux,+France/@44.8353083,-0.5750133,17z/data=!3m1!4b1!4m6!3m5!1s0xd5527dace2f6b7f:0x8c6f3e3f8a4f4e2!8m2!3d44.8353042!4d-0.5728246!16s%2Fg%2F11c52_5y9r';

const objets = (valeur: unknown): BlocJsonLd[] => {
  if (Array.isArray(valeur)) return valeur.flatMap(objets);
  if (valeur === null || typeof valeur !== 'object') return [];
  const bloc = valeur as BlocJsonLd;
  return [bloc, ...Object.values(bloc).flatMap(objets)];
};

const decritUneEntite = (bloc: BlocJsonLd): boolean => {
  const id = String(bloc['@id'] ?? '');
  const designee = id.endsWith('#organization') || id.endsWith('#person');
  return (
    TYPES_DES_ENTITES.has(String(bloc['@type'])) ||
    (designee && Object.keys(bloc).some((cle) => cle !== '@id'))
  );
};

const pagesServies = (): [string, string, BlocJsonLd[]][] =>
  METADONNEES_DU_SITE.site.locales.flatMap((langue) =>
    pagesIndexables(METADONNEES_DU_SITE).map((page): [string, string, BlocJsonLd[]] => [
      langue,
      page.path,
      jsonLdDeLaPage(METADONNEES_DU_SITE, langue, page),
    ]),
  );

const blocsEcrits = (): [string, unknown][] =>
  METADONNEES_DU_SITE.pages.flatMap((page) =>
    Object.entries(page.locales).map(([langue, meta]): [string, unknown] => [
      `${langue}${page.path}`,
      meta.jsonLd,
    ]),
  );

const entiteDuSite = (langue: string, type: string): BlocJsonLd | undefined =>
  jsonLdDeLaPage(METADONNEES_DU_SITE, langue).find((bloc) => bloc['@type'] === type);

describe('SEO-6 · l entreprise et la personne ne sont décrites qu une fois, dans global', () => {
  it('SEO-6 · chaque page ne décrit que l entreprise et la personne du site ; tout autre bloc les désigne par leur seul @id', () => {
    const doublons = pagesServies().flatMap(([langue, chemin, blocs]) => {
      const attendues = [entiteDuSite(langue, 'LocalBusiness'), entiteDuSite(langue, 'Person')].map(
        (entite) => JSON.stringify(entite),
      );
      return objets(blocs)
        .filter(decritUneEntite)
        .filter((bloc) => !attendues.includes(JSON.stringify(bloc)))
        .map((bloc) => `${langue}${chemin} : ${JSON.stringify(bloc).slice(0, 80)}`);
    });

    expect(doublons).toEqual([]);
  });

  it('SEO-6 · aucune page, indexée ou non, n écrit l entreprise ou la personne dans son propre JSON-LD', () => {
    expect(
      blocsEcrits().flatMap(([page, jsonLd]) =>
        objets(jsonLd)
          .filter(decritUneEntite)
          .map((bloc) => `${page} : ${JSON.stringify(bloc).slice(0, 80)}`),
      ),
    ).toEqual([]);
  });

  it('SEO-6 · les services, les cours et la page de contact désignent l entreprise par son @id', () => {
    const designations = blocsEcrits().flatMap(([page, jsonLd]) =>
      objets(jsonLd).flatMap((bloc) => {
        const cle = bloc['@type'] === 'ContactPage' ? 'mainEntity' : 'provider';
        return ['Service', 'Course', 'ContactPage'].includes(String(bloc['@type']))
          ? [[page, bloc['@type'], bloc[cle]]]
          : [];
      }),
    );

    expect(designations.map(([page]) => page)).toContain('en/formations/audit-seo-diy');
    expect(
      designations.filter(([, , cible]) => JSON.stringify(cible) !== JSON.stringify(ORGANISATION)),
    ).toEqual([]);
  });

  it('SEO-6 · /presentation ne sert plus de ProfessionalService', () => {
    const presentation = pagesServies().filter(([, chemin]) => chemin === '/presentation');

    expect(presentation.length).toBe(2);
    for (const [langue, , blocs] of presentation) {
      expect(blocs.map((bloc) => bloc['@type']))
        .withContext(langue)
        .toEqual([
          'LocalBusiness',
          'SiteNavigationElement',
          'Person',
          'ProfilePage',
          'BreadcrumbList',
        ]);
    }
  });

  it('SEO-6 · téléphone, e-mail, adresse et carte ne vivent que dans l entreprise', () => {
    for (const langue of METADONNEES_DU_SITE.site.locales) {
      const entreprise = entiteDuSite(langue, 'LocalBusiness');
      const personne = entiteDuSite(langue, 'Person');

      expect(entreprise).toEqual(
        jasmine.objectContaining({
          telephone: '+33698503282',
          email: 'moyencet@gmail.com',
          address: jasmine.objectContaining({ postalCode: '33100' }),
          hasMap: CARTE,
        }),
      );
      expect(
        Object.keys(personne ?? {}).filter((cle) =>
          ['telephone', 'email', 'address'].includes(cle),
        ),
      )
        .withContext(langue)
        .toEqual([]);
      expect(personne?.['worksFor']).toEqual(ORGANISATION);
    }
  });
});
