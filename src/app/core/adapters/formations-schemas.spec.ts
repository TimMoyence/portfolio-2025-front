import type { z } from 'zod';
import { instantaneDuFil } from '../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import { coursPublicServi, derouleServi, sujetServi } from './formations-schemas';

interface CoursDuFil {
  ecrans: Record<string, unknown>[];
}

interface InstantaneMutable {
  sujet: CoursDuFil;
  deroule: CoursDuFil;
  catalogue: CoursDuFil;
}

function ecarts(schema: z.ZodType, valeur: unknown): readonly string[] {
  const lu = schema.safeParse(valeur);
  return lu.success ? [] : lu.error.issues.map((issue) => `${issue.path.join('.')} ${issue.code}`);
}

function copieDuFil(cours: string): InstantaneMutable {
  const trouve = INSTANTANES_DES_COURS_SERVIS.find(([nom]) => nom === cours);
  if (trouve === undefined) {
    throw new Error(`Instantané du ${cours} introuvable`);
  }
  return structuredClone(trouve[2]) as InstantaneMutable;
}

describe('Schémas stricts des réponses des formations (L2b-SCHEMAS-ROUTES)', () => {
  for (const [cours, , fil] of INSTANTANES_DES_COURS_SERVIS) {
    it(`accepte le sujet, le déroulé et le catalogue servis du ${cours}`, () => {
      expect(ecarts(instantaneDuFil, fil)).toEqual([]);
    });
  }

  describe('sur le B2-03 servi, altéré', () => {
    it('refuse une clé inconnue dans un écran du sujet', () => {
      const fil = copieDuFil('B2-03');
      fil.sujet.ecrans[0]['inconnu'] = 1;

      expect(ecarts(sujetServi, fil.sujet)).toEqual(['ecrans.0 unrecognized_keys']);
    });

    it('refuse une clé inconnue dans les données d’un écran', () => {
      const fil = copieDuFil('B2-03');
      const donnees = fil.sujet.ecrans[0]['donnees'] as Record<string, unknown>;
      donnees['inconnu'] = 1;

      expect(ecarts(sujetServi, fil.sujet)).toEqual(['ecrans.0.donnees unrecognized_keys']);
    });

    it('refuse une clé inconnue au fond des données d’une brique', () => {
      const fil = copieDuFil('B2-03');
      const donnees = fil.sujet.ecrans[1]['donnees'] as { cas: Record<string, unknown> };
      donnees.cas['corrige'] = 'fuite';

      expect(ecarts(sujetServi, fil.sujet)).toEqual(['ecrans.1.donnees.cas unrecognized_keys']);
    });

    it('refuse un champ inconnu ajouté au plan d’un tableau servi', () => {
      const fil = copieDuFil('B2-03');
      const rang = fil.sujet.ecrans.findIndex((ecran) => ecran['type'] === 'fp-table-build');
      const donnees = fil.sujet.ecrans[rang]['donnees'] as { plan: Record<string, unknown> };
      donnees.plan['champFactice'] = true;

      expect(rang).toBeGreaterThanOrEqual(0);
      expect(ecarts(sujetServi, fil.sujet)).toEqual([
        `ecrans.${rang}.donnees.plan unrecognized_keys`,
      ]);
    });

    it('refuse des données privées des métadonnées de leur brique', () => {
      const fil = copieDuFil('B2-03');
      const donnees = fil.sujet.ecrans[0]['donnees'] as { recit: Record<string, unknown> };
      delete donnees.recit['metadonnees'];

      expect(ecarts(sujetServi, fil.sujet)).toEqual([
        'ecrans.0.donnees.recit.metadonnees invalid_type',
      ]);
    });

    it('refuse un écran privé de ses données', () => {
      const fil = copieDuFil('B2-03');
      delete fil.sujet.ecrans[0]['donnees'];

      expect(ecarts(sujetServi, fil.sujet)).toEqual(['ecrans.0.donnees invalid_type']);
    });

    it('refuse un écran d’un type que le front ne sait pas afficher', () => {
      const fil = copieDuFil('B2-03');
      fil.sujet.ecrans[0]['type'] = 'inconnu';

      expect(ecarts(sujetServi, fil.sujet)).toEqual(['ecrans.0.type invalid_union']);
    });

    it('refuse un écran du déroulé privé de ses notes', () => {
      const fil = copieDuFil('B2-03');
      delete fil.deroule.ecrans[0]['notes'];

      expect(ecarts(derouleServi, fil.deroule)).toEqual(['ecrans.0.notes invalid_type']);
    });

    it('refuse une correction servie dans le catalogue public', () => {
      const fil = copieDuFil('B2-03');
      fil.catalogue.ecrans[0]['correction'] = {
        ecranId: String(fil.catalogue.ecrans[0]['id']),
        questions: [],
        corrige: null,
        reflexion: null,
      };

      expect(ecarts(coursPublicServi, fil.catalogue)).toEqual(['ecrans.0 unrecognized_keys']);
      expect(ecarts(sujetServi, fil.catalogue)).toEqual([]);
    });

    it('refuse un corrigé d’écran d’un type que le front ne sait pas afficher', () => {
      const fil = copieDuFil('B2-03');
      const rang = fil.deroule.ecrans.findIndex((ecran) => ecran['corrigeEcran'] !== null);
      const corrige = fil.deroule.ecrans[rang]['corrigeEcran'] as Record<string, unknown>;
      corrige['type'] = 'inconnu';

      expect(rang).toBeGreaterThanOrEqual(0);
      expect(ecarts(derouleServi, fil.deroule)).toEqual([
        `ecrans.${rang}.corrigeEcran.type invalid_union`,
      ]);
    });
  });
});
