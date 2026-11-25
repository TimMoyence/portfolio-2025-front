import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface AsiliHeroMetaRow {
  readonly key: string;
  readonly value: string;
}

export interface MorceauDeTitre {
  readonly texte: string;
  readonly accent?: true;
  readonly aLaLigne?: true;
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
}
