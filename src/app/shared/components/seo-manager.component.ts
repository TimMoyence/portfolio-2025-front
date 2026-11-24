import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { APP_CONFIG } from '../../core/config/app-config.token';
import {
  buildLocalizedPath,
  routeSansLocale,
  urlAbsolue,
  urlLocalisee,
} from '../../core/seo/pages/chemins';
import { SeoRegistryService } from '../../core/seo/seo-registry.service';
import type { SeoConfig } from '../../core/seo/seo.interface';
import { SeoService } from '../../core/seo/seo.service';

function sansAncre(url: string): string {
  const diese = url.indexOf('#');
  return diese === -1 ? url : url.slice(0, diese);
}

@Component({
  selector: 'app-seo-manager',
  standalone: true,
  imports: [CommonModule],
  template: ``,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoManagerComponent {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly seoRegistry = inject(SeoRegistryService);
  private readonly destroyRef = inject(DestroyRef);
  private derniereUrl = '';

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        filter((event) => this.changeDePage(event.urlAfterRedirects)),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data),
        map((data) => data['seoKey']),
        filter((seoKey): seoKey is string => typeof seoKey === 'string'),
        switchMap((seoKey) => {
          const currentUrl = this.router.url;
          return this.seoRegistry.getSeoByKey(seoKey).pipe(map((seo) => ({ seo, currentUrl })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ seo, currentUrl }) => {
        this.applySeoConfig(seo, currentUrl);
      });
  }

  private changeDePage(url: string): boolean {
    const precedente = this.derniereUrl;
    this.derniereUrl = url;
    return sansAncre(url) !== sansAncre(precedente);
  }

  private applySeoConfig(seo: SeoConfig, currentUrl: string): void {
    const { baseUrl, canonicalUrl, hreflangs } = this.resolvePageUrls(currentUrl);
    const ogImage = this.resolveAbsoluteUrl(baseUrl, seo.ogImage);
    const twitterImage = this.resolveAbsoluteUrl(baseUrl, seo.twitterImage ?? ogImage);
    const images = { ogImage, twitterImage, ogUrl: canonicalUrl };

    this.seoService.updateSeoMetadata(
      seo.index ? { ...seo, ...images, canonicalUrl, hreflangs } : { ...seo, ...images },
    );
  }

  private resolvePageUrls(currentUrl: string): {
    baseUrl: string;
    canonicalUrl: string;
    hreflangs: Record<string, string>;
  } {
    const baseUrl = this.appConfig.baseUrl;
    const canonicalState = this.resolveCanonicalState(currentUrl);
    return {
      baseUrl,
      canonicalUrl: urlAbsolue(baseUrl, canonicalState.canonicalPath),
      hreflangs: this.buildHreflangs(baseUrl, canonicalState.relativePath),
    };
  }

  private buildHreflangs(baseUrl: string, relativePath: string): Record<string, string> {
    const locales = this.seoRegistry.getLocales();
    const hreflangs: Record<string, string> = {};
    for (const locale of locales) {
      hreflangs[locale] = urlLocalisee(baseUrl, locale, relativePath);
    }

    const defaultLocale = this.seoRegistry.getDefaultLocale();
    if (defaultLocale && locales.includes(defaultLocale)) {
      hreflangs['x-default'] = urlLocalisee(baseUrl, defaultLocale, relativePath);
    }
    return hreflangs;
  }

  private resolveCanonicalState(currentUrl: string): {
    canonicalPath: string;
    relativePath: string;
  } {
    const { locale, route: relativePath } = routeSansLocale(
      currentUrl,
      this.seoRegistry.getLocales(),
    );
    return {
      canonicalPath: buildLocalizedPath(locale ?? this.seoRegistry.getLocaleId(), relativePath),
      relativePath,
    };
  }

  private resolveAbsoluteUrl(baseUrl: string, value?: string): string | undefined {
    if (!value) return undefined;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    return urlAbsolue(baseUrl, value);
  }
}
