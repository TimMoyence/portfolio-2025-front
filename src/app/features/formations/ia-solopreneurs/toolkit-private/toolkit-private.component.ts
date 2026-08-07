import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LEAD_MAGNET_PORT } from '../../../../core/ports/lead-magnet.port';
import type { ToolkitPageData } from '../../../../core/models/toolkit-page.model';

type PageState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-toolkit-private',
  standalone: true,
  imports: [],
  templateUrl: './toolkit-private.component.html',
  styleUrl: './toolkit-private.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolkitPrivateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly port = inject(LEAD_MAGNET_PORT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly state = signal<PageState>('loading');
  readonly data = signal<ToolkitPageData | null>(null);
  readonly copiedText = signal<string | null>(null);
  readonly copyErrorText = signal<string | null>(null);

  protected readonly copyLabel = $localize`:@@formations.toolkitPrivate.copy:Copier`;

  protected readonly copiedLabel = $localize`:@@formations.toolkitPrivate.copied:Copié !`;

  protected readonly copyErrorLabel = $localize`:@@formations.toolkitPrivate.copyError:Échec — copiez à la main`;

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
        this.state.set('error');
      },
    });
  }

  protected copyButtonLabel(text: string): string {
    if (this.copyErrorText() === text) return this.copyErrorLabel;
    if (this.copiedText() === text) return this.copiedLabel;
    return this.copyLabel;
  }

  copyToClipboard(text: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const clipboard = navigator.clipboard;
    if (!clipboard) {
      this.signalCopyFailure(text, new Error('Clipboard API indisponible'));
      return;
    }

    clipboard
      .writeText(text)
      .then(() => {
        this.copyErrorText.set(null);
        this.copiedText.set(text);
        setTimeout(() => this.copiedText.set(null), 2000);
      })
      .catch((err: unknown) => this.signalCopyFailure(text, err));
  }

  private signalCopyFailure(text: string, err: unknown): void {
    console.error('Echec de copie dans le presse-papier', err);
    this.copiedText.set(null);
    this.copyErrorText.set(text);
    setTimeout(() => this.copyErrorText.set(null), 2500);
  }
}
