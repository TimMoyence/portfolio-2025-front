import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { of } from "rxjs";
import { filter, map, mergeMap, switchMap } from "rxjs/operators";
import { SeoService } from "../../core/seo/seo.service";
import { SeoConfig } from "../../core/seo/seo.interface";
import {
  SeoRegistryService,
  SeoResolvedConfig,
} from "../../core/seo/seo-registry.service";

@Component({
  selector: "app-seo-manager",
  standalone: true,
  imports: [CommonModule],
  template: ``,
  styles: [],
})
export class SeoManagerComponent implements OnInit {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private seoRegistry: SeoRegistryService,
  ) {}

  ngOnInit(): void {
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
        filter((route) => route.outlet === "primary"),
        mergeMap((route) => route.data),
        switchMap((data) => {
          const currentUrl = this.getCleanUrl(this.router.url);
          const seoKey = data["seoKey"];

          if (seoKey) {
            return this.seoRegistry
              .getSeoByKey(seoKey)
              .pipe(map((resolved) => ({ data, resolved, currentUrl })));
          }

          if (data["seo"]) {
            return of({ data, resolved: null, currentUrl });
          }

          return this.seoRegistry
            .getSeoByPath(currentUrl)
            .pipe(map((resolved) => ({ data, resolved, currentUrl })));
        }),
      )
      .subscribe(({ data, resolved, currentUrl }) => {
        if (resolved?.seo) {
          this.applySeoConfig(resolved.seo, currentUrl, resolved, data);
          return;
        }

        if (data["seo"]) {
          this.applySeoConfig(
            data["seo"],
            currentUrl,
            resolved,
            data,
            data["seoIndex"] === false,
          );
          return;
        }

        // Default SEO config if none provided in route data
        this.setDefaultSeo(currentUrl);
      });
  }

  private applySeoConfig(
    seo: SeoConfig,
    currentUrl: string,
    resolved: SeoResolvedConfig | null,
    data: Record<string, unknown>,
    forceNoIndex?: boolean,
  ): void {
    const baseUrl = this.resolveBaseUrl();
    const canonicalPath = this.buildCanonicalPath(currentUrl);
    const canonicalUrl = this.buildAbsoluteUrl(baseUrl, canonicalPath);
    const index =
      typeof forceNoIndex === "boolean"
        ? !forceNoIndex
        : resolved?.index ?? true;
    const robots =
      typeof data["robots"] === "string"
        ? (data["robots"] as string)
        : index
          ? "index, follow"
          : "noindex, nofollow";
    const ogImage = this.resolveAbsoluteUrl(baseUrl, seo.ogImage);
    const twitterImage = this.resolveAbsoluteUrl(
      baseUrl,
      seo.twitterImage ?? ogImage,
    );

    this.seoService.updateSeoMetadata({
      ...seo,
      ogImage,
      twitterImage,
      ogUrl: canonicalUrl,
      canonicalUrl,
      robots,
    });
  }

  private setDefaultSeo(currentUrl: string): void {
    const baseUrl = this.resolveBaseUrl();
    const canonicalPath = this.buildCanonicalPath(currentUrl);
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
      twitterCard: "summary_large_image",
      robots: "index, follow",
      canonicalUrl: this.buildAbsoluteUrl(baseUrl, canonicalPath),
      ogUrl: this.buildAbsoluteUrl(baseUrl, canonicalPath),
    };

    this.seoService.updateSeoMetadata(seoConfig);
  }

  private resolveBaseUrl(): string {
    return this.seoRegistry.getBaseUrl() ?? "https://asilidesign.fr";
  }

  private getCleanUrl(url: string): string {
    return url.split("?")[0].split("#")[0];
  }

  private buildCanonicalPath(currentUrl: string): string {
    const normalized = this.normalizePath(currentUrl);
    const locales = this.seoRegistry.getLocales();
    const hasLocalePrefix = locales.some(
      (locale) => normalized === `/${locale}` || normalized.startsWith(`/${locale}/`),
    );

    if (hasLocalePrefix) {
      return normalized;
    }

    const locale = this.seoRegistry.getLocaleId();
    if (!locale) {
      return normalized;
    }

    if (normalized === "/") {
      return `/${locale}`;
    }

    return `/${locale}${normalized}`;
  }

  private normalizePath(path: string): string {
    const clean = this.getCleanUrl(path);
    const trimmed = clean.replace(/^\/+/, "").replace(/\/+$/, "");
    return trimmed ? `/${trimmed}` : "/";
  }

  private buildAbsoluteUrl(baseUrl: string, path: string): string {
    const trimmedBase = baseUrl.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${trimmedBase}${normalizedPath}`;
  }

  private resolveAbsoluteUrl(baseUrl: string, value?: string): string | undefined {
    if (!value) return undefined;
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return this.buildAbsoluteUrl(baseUrl, value);
  }
}
