import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { SeoService } from '../../core/seo/seo.service';
import { SeoConfig } from '../../core/seo/seo.interface';

@Component({
  selector: 'app-seo-manager',
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
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data),
      )
      .subscribe((data) => {
        if (data['seo']) {
          const currentUrl = this.router.url;
          const baseUrl = 'https://portfolio-example.com'; // todo : Replace with actual domain in production

          const seoConfig: SeoConfig = {
            ...data['seo'],
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
      title: 'Professional Portfolio | Web Developer & Designer',
      description:
        'Explore my portfolio showcasing web development projects, courses, and professional services. Specializing in modern web technologies and creative solutions.',
      keywords: [
        'web development',
        'portfolio',
        'frontend',
        'backend',
        'full stack',
        'developer',
      ],
      ogImage: 'https://portfolio-example.com/assets/images/og-image.jpg', // Replace with actual image
      twitterCard: 'summary_large_image',
    };

    this.seoService.updateSeoMetadata(seoConfig);
  }
}
