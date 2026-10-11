import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { of } from 'rxjs';
import { filter, map, mergeMap, switchMap } from 'rxjs/operators';
import { APP_CONFIG } from '../../core/config/app-config.token';
import {
  buildLocalizedPath,
  estAliasDAccueil,
  routeSansLocale,
  urlAbsolue,
  urlLocalisee,
} from '../../core/seo/chemins';
import { SeoRegistryService, SeoResolvedConfig } from '../../core/seo/seo-registry.service';
import type { SeoConfig } from '../../core/seo/seo.interface';
import { SeoService } from '../../core/seo/seo.service';

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

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data),
        switchMap((data) => {
          const currentUrl = this.router.url;
          const seoKey = data['seoKey'];

          if (seoKey) {
            return this.seoRegistry
              .getSeoByKey(seoKey)
              .pipe(map((resolved) => ({ data, resolved, currentUrl })));
          }

          if (data['seo']) {
            return of({ data, resolved: null, currentUrl });
          }

          return this.seoRegistry
            .getSeoByPath(currentUrl)
            .pipe(map((resolved) => ({ data, resolved, currentUrl })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ data, resolved, currentUrl }) => {
        if (resolved?.seo) {
          this.applySeoConfig(resolved.seo, currentUrl, resolved, data);
          return;
        }

        if (data['seo']) {
          this.applySeoConfig(data['seo'], currentUrl, resolved, data, data['seoIndex'] === false);
          return;
        }

        this.setDefaultSeo(currentUrl, data);
      });
  }

  private applySeoConfig(
    seo: SeoConfig,
    currentUrl: string,
    resolved: SeoResolvedConfig | null,
    data: Record<string, unknown>,
    forceNoIndex?: boolean,
  ): void {
    const { baseUrl, canonicalUrl, hreflangs } = this.resolvePageUrls(currentUrl);
    const index = typeof forceNoIndex === 'boolean' ? !forceNoIndex : (resolved?.index ?? true);
    const ogImage = this.resolveAbsoluteUrl(baseUrl, seo.ogImage);
    const twitterImage = this.resolveAbsoluteUrl(baseUrl, seo.twitterImage ?? ogImage);

    this.seoService.updateSeoMetadata({
      ...seo,
      ogImage,
      twitterImage,
      ogUrl: canonicalUrl,
      canonicalUrl,
      robots: this.resolveRobots(data, index),
      hreflangs,
    });
  }

  private resolvePageUrls(currentUrl: string): {
    baseUrl: string;
    canonicalUrl: string;
    hreflangs: Record<string, string>;
  } {
    const baseUrl = this.resolveBaseUrl();
    const canonicalState = this.resolveCanonicalState(currentUrl);
    return {
      baseUrl,
      canonicalUrl: urlAbsolue(baseUrl, canonicalState.canonicalPath),
      hreflangs: this.buildHreflangs(baseUrl, canonicalState.relativePath),
    };
  }

  private resolveRobots(data: Record<string, unknown>, index: boolean): string {
    const declared = data['robots'];
    if (typeof declared === 'string') {
      return declared;
    }
    return index ? 'index, follow' : 'noindex, nofollow';
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

  private setDefaultSeo(currentUrl: string, data: Record<string, unknown> = {}): void {
    const { baseUrl, canonicalUrl, hreflangs } = this.resolvePageUrls(currentUrl);

    const seoConfig: SeoConfig = {
      title: $localize`:seo.default.title|Fallback SEO title@@seoDefaultTitle:Professional Portfolio | Web Developer & Designer`,
      description: $localize`:seo.default.description|Fallback SEO description@@seoDefaultDescription:Explore my portfolio showcasing web development projects, courses, and professional services. Specializing in modern web technologies and creative solutions.`,
      keywords: [
        $localize`:seo.default.keyword.webDev|SEO keyword@@seoKeywordWebDev:web development`,
        $localize`:seo.default.keyword.portfolio|SEO keyword@@seoKeywordPortfolio:portfolio`,
        $localize`:seo.default.keyword.frontend|SEO keyword@@seoKeywordFrontend:frontend`,
        $localize`:seo.default.keyword.backend|SEO keyword@@seoKeywordBackend:backend`,
        $localize`:seo.default.keyword.fullstack|SEO keyword@@seoKeywordFullstack:full stack`,
        $localize`:seo.default.keyword.developer|SEO keyword@@seoKeywordDeveloper:developer`,
      ],
      ogImage: `${baseUrl}/assets/images/logo.webp`,
      twitterCard: 'summary_large_image',
      robots: this.resolveRobots(data, true),
      canonicalUrl,
      ogUrl: canonicalUrl,
      hreflangs,
    };

    this.seoService.updateSeoMetadata(seoConfig);
  }

  private resolveBaseUrl(): string {
    return this.appConfig.baseUrl || this.seoRegistry.getBaseUrl() || 'https://asilidesign.fr';
  }

  private resolveCanonicalState(currentUrl: string): {
    canonicalPath: string;
    relativePath: string;
  } {
    const { locale, route } = routeSansLocale(currentUrl, this.seoRegistry.getLocales());
    const relativePath = estAliasDAccueil(route) ? '/' : route;
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
