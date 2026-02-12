import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

@Component({
  selector: "app-terms",
  standalone: true,
  imports: [CommonModule, RouterModule, HeroSectionComponent],
  templateUrl: "./terms.component.html",
  styleUrl: "./terms.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
  readonly hero = {
    label: $localize`:terms.hero.label@@termsHeroLabel:Conditions d'utilisation`,
    title: $localize`:terms.hero.title@@termsHeroTitle:Conditions de services`,
    description: $localize`:terms.hero.description@@termsHeroDescription:Ces conditions encadrent l'accès au site et l'utilisation des services proposés.`,
  };

  readonly meta = {
    lastUpdated: $localize`:terms.meta.lastUpdated@@termsMetaLastUpdated:Dernière mise à jour : 11 février 2026`,
  };
}
