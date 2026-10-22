import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { readJson, writeJson } from '../../../../cours/runtime/core/storage';
import { VERSIONS_DES_TEXTES_LEGAUX } from '../../../core/config/textes-legaux';

export const CLE_DU_BANDEAU_LU = 'fp.bandeau-cookies-lu';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBannerComponent {
  private readonly version = VERSIONS_DES_TEXTES_LEGAUX.confidentialite;

  protected readonly visible = signal(
    isPlatformBrowser(inject(PLATFORM_ID)) && readJson<string>(CLE_DU_BANDEAU_LU) !== this.version,
  );

  protected compris(): void {
    writeJson(CLE_DU_BANDEAU_LU, this.version);
    this.visible.set(false);
  }
}
