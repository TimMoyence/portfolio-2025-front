import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Liste blanche des hotes autorises pour une iframe video.
 *
 * Chaque entree est testee comme prefixe normalise (`host` + debut de
 * `pathname`) de l'URL fournie. Toute source ne correspondant a aucune
 * entree est neutralisee (source vide) avant `bypassSecurityTrustResourceUrl`.
 */
const ALLOWED_IFRAME_PREFIXES = [
  'youtube-nocookie.com/',
  'youtube.com/embed/',
  'player.vimeo.com/',
] as const;

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

  /**
   * URL d'iframe assainie.
   *
   * Invariant : `src` est un contenu auteur de confiance (defini dans les decks
   * de slides). On applique neanmoins une defense en profondeur : seule une URL
   * dont l'hote figure dans {@link ALLOWED_IFRAME_PREFIXES} (ou une ressource
   * locale relative) est passee a `bypassSecurityTrustResourceUrl`. Tout autre
   * hote produit une source vide/neutre — le rendu ne change pas pour les
   * valeurs actuelles (toutes dans l'allowlist).
   *
   * Le calcul n'a lieu qu'en mode `iframe` ; en mode natif, la balise `<video>`
   * lit `src()` directement sans assainissement.
   */
  readonly safeIframeSrc = computed<SafeResourceUrl>(() => {
    if (this.type() !== 'iframe') {
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }
    const url = this.src();
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.isAllowedIframeUrl(url) ? url : '');
  });

  /**
   * Verifie qu'une URL d'iframe est autorisee.
   *
   * - Les URL relatives (ressources locales servies par l'origine de l'app)
   *   sont autorisees.
   * - Les URL absolues doivent etre en HTTPS et correspondre a un prefixe
   *   `host + pathname` de l'allowlist (le `www.` initial est ignore).
   * - Toute URL non parsable est rejetee.
   */
  private isAllowedIframeUrl(raw: string): boolean {
    const value = raw.trim();
    if (value === '') {
      return false;
    }
    // Ressource locale relative (sert depuis l'origine de l'app).
    if (value.startsWith('/') && !value.startsWith('//')) {
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
    const host = parsed.host.replace(/^www\./, '');
    const target = `${host}${parsed.pathname}`;
    return ALLOWED_IFRAME_PREFIXES.some((prefix) => target.startsWith(prefix));
  }
}
