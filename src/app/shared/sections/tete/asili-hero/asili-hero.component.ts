import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface AsiliHeroMetaRow {
  readonly key: string;
  readonly value: string;
}

export interface MorceauDeTitre {
  readonly texte: string;
  readonly accent?: true;
  readonly aLaLigne?: true;
}

interface Segment {
  readonly texte: string;
  readonly accent: boolean;
}

interface ElementDuTitre {
  readonly segments: Segment[];
  readonly rang: number;
  readonly saut: boolean;
}

function elementsDuTitre(titre: readonly MorceauDeTitre[]): readonly ElementDuTitre[] {
  const elements: ElementDuTitre[] = [];
  let mot: ElementDuTitre | null = null;
  let rang = 0;
  const separer = (saut: boolean): void => {
    mot = null;
    elements.push({ segments: [], rang: -1, saut });
  };
  for (const { texte, accent, aLaLigne } of titre) {
    if (aLaLigne && elements.length > 0) separer(true);
    for (const bout of texte.split(/(\s+)/).filter(Boolean)) {
      if (/^\s+$/.test(bout)) {
        separer(false);
        continue;
      }
      if (mot === null) {
        mot = { segments: [], rang: rang++, saut: false };
        elements.push(mot);
      }
      mot.segments.push({ texte: bout, accent: accent === true });
    }
  }
  return elements;
}

@Component({
  selector: 'app-asili-hero',
  standalone: true,
  templateUrl: './asili-hero.component.html',
  styleUrls: ['./asili-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliHeroComponent {
  readonly titre = input<readonly MorceauDeTitre[]>([]);

  readonly kicker = input<string | null>(null);

  readonly lead = input<string | null>(null);

  readonly metaRows = input<readonly AsiliHeroMetaRow[]>([]);

  protected readonly elements = computed(() => elementsDuTitre(this.titre()));
}
