import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const ALLOWED_IFRAME_HOST_PATH_PREFIXES = [
  'youtube-nocookie.com/',
  'youtube.com/embed/',
  'player.vimeo.com/',
] as const;

function isSameOriginPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

function isAllowedIframeUrl(raw: string): boolean {
  const value = raw.trim();
  if (value === '') {
    return false;
  }
  if (isSameOriginPath(value)) {
    return true;
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') {
    return false;
  }
  const hostPath = `${parsed.host.replace(/^www\./, '')}${parsed.pathname}`;
  return ALLOWED_IFRAME_HOST_PATH_PREFIXES.some((prefix) => hostPath.startsWith(prefix));
}

@Component({
  selector: 'app-slide-video',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-video.component.html',
  styleUrl: './slide-video.component.scss',
})
export class SlideVideoComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly src = input.required<string>();
  readonly type = input<'native' | 'iframe'>('native');
  readonly poster = input<string>('');
  readonly caption = input<string>('');
  readonly autoplay = input<boolean>(false);

  readonly safeIframeSrc = computed<SafeResourceUrl>(() => {
    const url = this.type() === 'iframe' && isAllowedIframeUrl(this.src()) ? this.src() : '';
    // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization -- url restreinte par isAllowedIframeUrl a ALLOWED_IFRAME_HOST_PATH_PREFIXES
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
}
