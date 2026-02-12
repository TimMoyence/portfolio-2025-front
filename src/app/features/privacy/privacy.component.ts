import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeroSectionComponent } from "../../shared/components/hero-section/hero-section.component";

@Component({
  selector: "app-privacy",
  standalone: true,
  imports: [CommonModule, RouterModule, HeroSectionComponent],
  templateUrl: "./privacy.component.html",
  styleUrl: "./privacy.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  readonly hero = {
    label: $localize`:privacy.hero.label@@privacyHeroLabel:Politique de confidentialité`,
    title: $localize`:privacy.hero.title@@privacyHeroTitle:Protection des données`,
    description: $localize`:privacy.hero.description@@privacyHeroDescription:Cette politique décrit comment les données sont collectées, utilisées et protégées.`,
  };

  readonly meta = {
    lastUpdated: $localize`:privacy.meta.lastUpdated@@privacyMetaLastUpdated:Dernière mise à jour : 11 février 2026`,
  };
}
