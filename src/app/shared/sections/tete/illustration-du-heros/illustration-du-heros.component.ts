import { ChangeDetectionStrategy, Component } from '@angular/core';
import { variantesDeLargeur } from '../../../images/variantes-de-largeur';
import {
  LARGEUR_DU_CONTENEUR,
  PLEINE_LARGEUR_SUR_TABLETTE,
} from '../../fin/asili-projects-grid/asili-projects-grid.component';

const LARGEUR_NATURELLE = 1022;

export const LARGEUR_DU_VISUEL = `${PLEINE_LARGEUR_SUR_TABLETTE}, calc((${LARGEUR_DU_CONTENEUR} - 32px) * 0.425)`;

@Component({
  selector: 'app-illustration-du-heros',
  standalone: true,
  template: `<img
    src="/assets/images/audit.webp"
    [attr.srcset]="variantes"
    [attr.sizes]="largeurAffichee"
    [alt]="description"
    width="1022"
    height="952"
    fetchpriority="high"
    decoding="async"
  />`,
  styles: `
    :host {
      display: block;
    }

    img {
      display: block;
      width: 100%;
      height: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IllustrationDuHerosComponent {
  protected readonly variantes = variantesDeLargeur('/assets/images/audit', LARGEUR_NATURELLE);

  protected readonly largeurAffichee = LARGEUR_DU_VISUEL;

  protected readonly description = $localize`:@@illustrationDuHerosAlt:Tim Moyence au travail sur son ordinateur portable`;
}
