import { creerBrique, enregistrerBrique } from '../../../testing/banc-de-brique';
import { ecransDuPupitreDe } from '../../../testing/fixtures/instantane-de-cours';
import { INSTANTANES_DES_COURS_SERVIS } from '../../../testing/fixtures/instantanes-des-cours';
import { FpConcept4 } from './FpConcept4';
import { FpPlot } from './FpPlot';

const BRIQUES_REGLABLES: Readonly<Record<string, CustomElementConstructor>> = {
  'fp-concept4': FpConcept4,
  'fp-plot': FpPlot,
};
const ESPACE_FINE = ' ';
const INSECABLE = ' ';
const NOMBRE_A_LA_FRANCAISE = new RegExp(
  `^-?[0-9]{1,3}(${ESPACE_FINE}[0-9]{3})*(,[0-9]{1,2})?(${INSECABLE}€)?$`,
);

interface ValeurAffichee {
  readonly lieu: string;
  readonly texte: string;
}

const REGLABLES_SERVIS = INSTANTANES_DES_COURS_SERVIS.flatMap(([cours, instantane]) =>
  ecransDuPupitreDe(instantane)
    .filter(({ type }) => type in BRIQUES_REGLABLES)
    .map((ecran) => ({ cours, ecran })),
);

function valeursAffichees(balise: string, definition: unknown): string[] {
  const brique = creerBrique<HTMLElement & { definition: unknown }>(balise, (hote) => {
    hote.definition = definition;
  });
  const sorties = [...(brique.shadowRoot?.querySelectorAll('[data-testid="valeur"]') ?? [])];
  brique.remove();
  return sorties.map((sortie) => sortie.textContent?.trim() ?? '');
}

describe('briques reglables des cours servis', () => {
  beforeAll(() => {
    for (const [balise, classe] of Object.entries(BRIQUES_REGLABLES)) {
      enregistrerBrique(balise, classe);
    }
  });

  it('L4-F11 · ecrivent chaque valeur reglee a la francaise, milliers en espace fine', () => {
    const valeurs: ValeurAffichee[] = REGLABLES_SERVIS.flatMap(({ cours, ecran }) =>
      valeursAffichees(ecran.type, ecran.donnees?.['definition']).map((texte) => ({
        lieu: `${cours} ${ecran.id}`,
        texte,
      })),
    );

    expect(REGLABLES_SERVIS.length).toBeGreaterThan(0);
    expect(valeurs.filter(({ texte }) => !NOMBRE_A_LA_FRANCAISE.test(texte))).toEqual([]);
    expect(valeurs.filter(({ texte }) => texte.includes(ESPACE_FINE)).length).toBeGreaterThan(0);
  });
});
