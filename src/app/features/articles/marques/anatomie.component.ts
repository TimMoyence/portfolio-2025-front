import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PublishedArticle } from '../../../core/models/article.model';
import { anatomieDeLEdition } from '../edition/anatomie-de-l-edition';
import { identiteDeRubrique } from '../edition/identite-des-rubriques';
import { PictoDeRubriqueComponent } from './marques-de-l-edition.component';

interface Barre {
  readonly cle: string;
  readonly libelle: string;
  readonly nombre: number;
  readonly largeur: number;
  readonly couleur: string;
  readonly picto: string | null;
}

interface TextesDeFigure {
  readonly titre: string;
  readonly note: string;
  readonly colonneLibelle: string;
  readonly colonneNombre: string;
}

interface Figure extends TextesDeFigure {
  readonly cle: string;
  readonly barres: readonly Barre[];
  readonly description: string;
}

const COULEUR_DES_PUBLICATIONS = 'var(--teal-deep)';

function enBarres(parts: readonly Omit<Barre, 'largeur'>[]): readonly Barre[] {
  const plusGrande = Math.max(1, ...parts.map((part) => part.nombre));
  return parts.map((part) => ({ ...part, largeur: (part.nombre / plusGrande) * 100 }));
}

function ligne(barre: Barre): string {
  return `${barre.libelle} ${barre.nombre}`;
}

function figure(cle: string, textes: TextesDeFigure, barres: readonly Barre[]): Figure {
  const lignes = barres.map(ligne).join(', ');
  return {
    cle,
    ...textes,
    barres,
    description: $localize`:@@articlesAnatomieDescription:${textes.titre}:titre: : ${lignes}:lignes:`,
  };
}

@Component({
  selector: 'app-anatomie',
  standalone: true,
  imports: [PictoDeRubriqueComponent],
  templateUrl: './anatomie.component.html',
  styleUrl: './anatomie.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnatomieComponent {
  readonly article = input.required<PublishedArticle>();

  private readonly textesDesRubriques: TextesDeFigure = {
    titre: $localize`:@@articlesAnatomieRubriques:Répartition par rubrique`,
    note: $localize`:@@articlesAnatomieNoteRubriques:Cartes et brèves de chaque rubrique, hors décryptage.`,
    colonneLibelle: $localize`:@@articlesAnatomieColonneRubrique:Rubrique`,
    colonneNombre: $localize`:@@articlesAnatomieColonneInformations:Informations`,
  };

  private readonly textesDesPublications: TextesDeFigure = {
    titre: $localize`:@@articlesAnatomiePublications:D’où viennent les informations`,
    note: $localize`:@@articlesAnatomieNotePublications:Informations retenues par publication.`,
    colonneLibelle: $localize`:@@articlesAnatomieColonnePublication:Publication`,
    colonneNombre: $localize`:@@articlesAnatomieColonneInformationsRetenues:Informations`,
  };

  protected readonly anatomie = computed(() => anatomieDeLEdition(this.article()));

  protected readonly pourcentage = computed(() => {
    const part = this.anatomie().partDes24Heures;
    return part === null ? null : Math.round(part * 100);
  });

  private readonly rubriques = computed(() =>
    enBarres(
      this.anatomie().rubriques.map((part) => {
        const identite = identiteDeRubrique(part.id, part.titre);
        return {
          cle: part.id,
          libelle: identite.libelle,
          nombre: part.nombre,
          couleur: identite.couleur,
          picto: part.id,
        };
      }),
    ),
  );

  private readonly publications = computed(() => {
    const anatomie = this.anatomie();
    const enTete = anatomie.publicationsEnTete.map((part) => ({
      cle: part.nom,
      libelle: part.nom,
      nombre: part.nombre,
      couleur: COULEUR_DES_PUBLICATIONS,
      picto: null,
    }));
    const autres = anatomie.autresPublications;
    const reste = autres
      ? [
          {
            cle: '',
            libelle: $localize`:@@articlesAnatomieAutresPublications:${autres.publications}:nombre: autres publications`,
            nombre: autres.informations,
            couleur: 'var(--ink-faint)',
            picto: null,
          },
        ]
      : [];
    return enBarres([...enTete, ...reste]);
  });

  protected readonly figures = computed(() =>
    [
      figure('rubriques', this.textesDesRubriques, this.rubriques()),
      figure('publications', this.textesDesPublications, this.publications()),
    ].filter((une) => une.barres.length > 0),
  );
}
