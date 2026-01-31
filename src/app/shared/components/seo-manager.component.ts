import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, map, mergeMap } from "rxjs/operators";
import { SeoService } from "../../core/seo/seo.service";
import { SeoConfig } from "../../core/seo/seo.interface";

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
      )
      .subscribe((data) => {
        if (data["seo"]) {
          const currentUrl = this.router.url;
          const baseUrl = "https://asilidesign.fr"; // todo : Replace with actual domain in production

          const seoConfig: SeoConfig = {
            ...data["seo"],
            ogUrl: `${baseUrl}${currentUrl}`,
            canonicalUrl: `${baseUrl}${currentUrl}`,
          };

          this.seoService.updateSeoMetadata(seoConfig);
        } else {
          // Default SEO config if none provided in route data
          this.setDefaultSeo();
        }
      });

    // Set default SEO on initial load
    this.setDefaultSeo();
  }

  private setDefaultSeo(): void {
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
      ogImage: "https://asilidesign.fr/assets/images/og-image.jpg", // Replace with actual image
      twitterCard: "summary_large_image",
    };

    this.seoService.updateSeoMetadata(seoConfig);
  }
}
