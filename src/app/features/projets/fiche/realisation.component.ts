import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  familleDeLaRealisation,
  realisationDuSlug,
  vignetteDeLaRealisation,
} from '../realisations.data';

@Component({
  selector: 'app-realisation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './realisation.component.html',
  styleUrl: './realisation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealisationComponent {
  readonly slug = input<string>();

  protected readonly realisation = computed(() => realisationDuSlug(this.slug()));

  protected readonly famille = computed(() => {
    const realisation = this.realisation();
    return realisation ? familleDeLaRealisation(realisation) : undefined;
  });

  protected readonly vignette = vignetteDeLaRealisation;
}
