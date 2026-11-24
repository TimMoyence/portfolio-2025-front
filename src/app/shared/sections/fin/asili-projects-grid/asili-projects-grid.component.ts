import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AsiliEnTeteDirective, LIENS_ASILI } from '../../asili-en-tete.directive';

interface AsiliProjectTag {
  readonly label: string;
  readonly prod: boolean;
}

export interface AsiliProject {
  readonly title: string;
  readonly desc: string;
  readonly tags: readonly AsiliProjectTag[];
  readonly image: string;
  readonly srcset: string;
  readonly imageAlt: string;
  readonly href: string;
  readonly vignette: string;
}

export const LARGEUR_DU_CONTENEUR = 'min(100vw, 1280px) - 2 * clamp(20px, 5vw, 72px)';

export const PLEINE_LARGEUR_SUR_TABLETTE = `(max-width: 860px) calc(${LARGEUR_DU_CONTENEUR})`;

const CADRE_DE_LA_VIGNETTE = {
  width: 800,
  height: 600,
  sizes: `${PLEINE_LARGEUR_SUR_TABLETTE}, calc((${LARGEUR_DU_CONTENEUR} - 44px) / 3)`,
} as const;

@Component({
  selector: 'app-asili-projects-grid',
  standalone: true,
  imports: [LIENS_ASILI],
  templateUrl: './asili-projects-grid.component.html',
  styleUrls: ['./asili-projects-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsiliProjectsGridComponent extends AsiliEnTeteDirective {
  readonly projects = input.required<readonly AsiliProject[]>();

  protected readonly cadre = CADRE_DE_LA_VIGNETTE;
}
