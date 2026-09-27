import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const DOSSIERS_DES_COURS: readonly { readonly cours: string; readonly version: string }[] = [
  { cours: 'b2-01', version: 'v3' },
  { cours: 'b2-02', version: 'v1' },
];
const PREFIXES_DE_LOCALE = ['/fr', '/en'];
const TYPES_ATTENDUS: Readonly<Record<string, string>> = {
  webp: 'image/webp',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  vtt: 'text/vtt',
};

const baseSsr = process.env['SSR_BASE_URL'] ?? '';

interface FichierDeMedia {
  readonly id: string;
  readonly fichier: string;
  readonly octets: number;
}

interface MediaDuCatalogue {
  readonly id: string;
  readonly manifeste?: string;
  readonly fichiers?: readonly { fichier: string; octets: number }[];
}

function lireJson<T>(chemin: string): T {
  return JSON.parse(readFileSync(chemin, 'utf8')) as T;
}

function fichiersDeLaCapsule(dossier: string, media: MediaDuCatalogue): FichierDeMedia[] {
  const capsule = lireJson<{ fichiers?: { fichier: string; octets: number }[] }>(
    `${dossier}/${media.manifeste}`,
  );
  return (capsule.fichiers ?? []).map(({ fichier, octets }) => ({ id: media.id, fichier, octets }));
}

function fichiersDuCatalogue(dossier: string): FichierDeMedia[] {
  const catalogue = `${dossier}/medias.manifest.json`;
  const lu = lireJson<{ medias?: MediaDuCatalogue[] }>(catalogue);
  const fichiers = (lu.medias ?? []).flatMap((media) =>
    typeof media.manifeste === 'string'
      ? fichiersDeLaCapsule(dossier, media)
      : (media.fichiers ?? []).map(({ fichier, octets }) => ({ id: media.id, fichier, octets })),
  );
  if (fichiers.length === 0) {
    throw new Error(
      `cours-medias : ${catalogue} ne catalogue aucun fichier — une suite qui verifie zero media rend un vert qui ne prouve rien.`,
    );
  }
  return fichiers;
}

function typeAttendu(fichier: string): string {
  const extension = fichier.slice(fichier.lastIndexOf('.') + 1);
  const type = TYPES_ATTENDUS[extension];
  if (type === undefined) {
    throw new Error(
      `cours-medias : aucun type MIME attendu pour « .${extension} » (${fichier}). Completez TYPES_ATTENDUS plutot que de laisser passer le fichier.`,
    );
  }
  return type;
}

for (const { cours, version } of DOSSIERS_DES_COURS) {
  const prefixeServi = `/assets/cours/${cours}/${version}`;
  const medias = fichiersDuCatalogue(`src${prefixeServi}`);

  test.describe(`medias du cours ${cours.toUpperCase()} servis par le build (V3-L5)`, () => {
    test.skip(
      baseSsr === '',
      'hors porte : SSR_BASE_URL absente. La porte la fournit (npm run test:e2e:portail).',
    );

    for (const media of medias) {
      test(`${media.id} — ${media.fichier} repond 200 avec son type MIME`, async ({ request }) => {
        const reponse = await request.get(`${baseSsr}${prefixeServi}/${media.fichier}`);

        expect(reponse.status()).toBe(200);
        expect(reponse.headers()['content-type']).toContain(typeAttendu(media.fichier));
        expect((await reponse.body()).byteLength).toBe(media.octets);
      });
    }

    test('sert les memes medias sous le prefixe de chaque locale', async ({ request }) => {
      for (const prefixe of PREFIXES_DE_LOCALE) {
        for (const media of medias) {
          const reponse = await request.fetch(
            `${baseSsr}${prefixe}${prefixeServi}/${media.fichier}`,
            { method: 'HEAD' },
          );

          expect(
            reponse.status(),
            `${prefixe}${prefixeServi}/${media.fichier} doit etre servi`,
          ).toBe(200);
          expect(reponse.headers()['content-type']).toContain(typeAttendu(media.fichier));
        }
      }
    });

    test('ne sert pas les manifestes de licence comme un media', async ({ request }) => {
      const reponse = await request.get(`${baseSsr}${prefixeServi}/medias.manifest.json`);

      expect(reponse.status()).toBe(200);
      expect(reponse.headers()['content-type']).toContain('application/json');
      expect(medias.map((media) => media.fichier)).not.toContain('medias.manifest.json');
    });
  });
}
