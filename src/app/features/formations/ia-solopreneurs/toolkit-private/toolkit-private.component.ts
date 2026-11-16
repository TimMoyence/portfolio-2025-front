import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LEAD_MAGNET_PORT } from '../../../../core/ports/lead-magnet.port';
import { HTTP_RESPONSE_STATUS } from '../../../../core/ssr/http-response-status';
import type { ToolkitPageData } from '../../../../core/models/toolkit-page.model';
import { PictoComponent } from '../../../../shared/components/picto/picto.component';
import { PressePapiersService } from '../../../../shared/services/presse-papiers.service';

type PageState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-toolkit-private',
  standalone: true,
  imports: [PictoComponent],
  providers: [PressePapiersService],
  templateUrl: './toolkit-private.component.html',
  styleUrl: './toolkit-private.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitPrivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly port = inject(LEAD_MAGNET_PORT);
  private readonly responseStatus = inject(HTTP_RESPONSE_STATUS, { optional: true });

  readonly pressePapiers = inject(PressePapiersService);

  readonly state = signal<PageState>('loading');
  readonly data = signal<ToolkitPageData | null>(null);

  readonly libellesDeCopie = {
    repos: $localize`:@@formations.toolkitPrivate.copy:Copier`,
    copie: $localize`:@@formations.toolkitPrivate.copied:Copié !`,
  };

  readonly isLoaded = computed(() => this.state() === 'loaded' && this.data() !== null);

  constructor() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    this.port.getToolkitByToken(token).subscribe({
      next: (pageData) => {
        this.data.set(pageData);
        this.state.set('loaded');
      },
      error: () => {
        this.responseStatus?.set(404);
        this.state.set('error');
      },
    });
  }
}
