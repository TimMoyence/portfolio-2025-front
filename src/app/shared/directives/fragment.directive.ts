import { computed, Directive, input } from "@angular/core";
import { FragmentService } from "../services/fragment.service";

/**
 * Directive de visibilite progressive pour les fragments de presentation.
 * Applique les classes CSS `.fragment-visible` ou `.fragment-hidden` selon
 * l'etat du FragmentService parent, avec une transition animee.
 *
 * Usage :
 * ```html
 * <li [appFragment]="0">Premier point</li>
 * <li [appFragment]="1">Deuxieme point</li>
 * ```
 *
 * Le composant parent doit fournir `FragmentService` dans ses providers.
 */
@Directive({
  selector: "[appFragment]",
  standalone: true,
  host: {
    "[style.transition]": "'opacity 0.4s ease-out, transform 0.4s ease-out'",
    "[style.opacity]": "isVisible() ? '1' : '0'",
    "[style.transform]": "isVisible() ? 'translateY(0)' : 'translateY(12px)'",
    "[class.fragment-visible]": "isVisible()",
    "[class.fragment-hidden]": "!isVisible()",
  },
})
export class FragmentDirective {
  /** Index 0-based du fragment dans la slide. */
  readonly appFragment = input.required<number>();

  private readonly fragmentService: FragmentService;

  /** Computed : true si ce fragment doit etre visible. */
  readonly isVisible = computed(
    () => this.fragmentService.visibleCount() > this.appFragment(),
  );

  constructor(fragmentService: FragmentService) {
    this.fragmentService = fragmentService;
  }
}
