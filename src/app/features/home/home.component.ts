import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ContactComponent } from '../../shared/components/contact/contact.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CtaSectionComponent } from './components/cta-section/cta-section.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { MissionSectionComponent } from './components/mission-section/mission-section.component';
import { ProductShowcaseComponent } from './components/product-showcase/product-showcase.component';
import { ProjectsAccordionComponent } from './components/projects-accordion/projects-accordion.component';
import { ServicesSectionComponent } from './components/services-section/services-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    ServicesSectionComponent,
    ProjectsAccordionComponent,
    MissionSectionComponent,
    ProductShowcaseComponent,
    ContactComponent,
    CtaSectionComponent,
    FooterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
