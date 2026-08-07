import { computed, Directive, input } from '@angular/core';
import { FragmentService } from '../services/fragment.service';

@Directive({
  selector: '[appFragment]',
  standalone: true,
  host: {
    '[style.transition]': "'opacity 0.4s ease-out, transform 0.4s ease-out'",
    '[style.opacity]': "isVisible() ? '1' : '0'",
    '[style.transform]': "isVisible() ? 'translateY(0)' : 'translateY(12px)'",
    '[class.fragment-visible]': 'isVisible()',
    '[class.fragment-hidden]': '!isVisible()',
  },
})
export class FragmentDirective {
  readonly appFragment = input.required<number>();

  private readonly fragmentService: FragmentService;

  readonly isVisible = computed(() => this.fragmentService.visibleCount() > this.appFragment());

  constructor(fragmentService: FragmentService) {
    this.fragmentService = fragmentService;
  }
}
