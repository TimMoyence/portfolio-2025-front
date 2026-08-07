import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { BreakpointService } from '../../../core/services/breakpoint.service';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  animations: [
    trigger('panelAnimation', [
      transition('void => mobile', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
      transition('mobile => void', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 })),
      ]),
      transition('void => desktop', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition('desktop => void', [animate('150ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  host: { class: 'block' },
  template: `
    @if (open()) {
      @if (isMobile()) {
        <div
          data-testid="bottom-sheet-backdrop"
          class="fixed inset-0 z-50 bg-black/50"
          @fadeIn
          role="button"
          tabindex="-1"
          aria-label="Fermer"
          (click)="close()"
          (keydown.escape)="close()"
        ></div>
      }

      <div
        data-testid="bottom-sheet-overlay"
        [class]="isMobile() ? 'fixed inset-x-0 bottom-0 z-50' : 'mt-4'"
      >
        <div
          data-testid="bottom-sheet-panel"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title()"
          [class]="panelClasses()"
          [@panelAnimation]="isMobile() ? 'mobile' : 'desktop'"
          (keydown.escape)="close()"
          #panelRef
        >
          @if (isMobile()) {
            <div
              class="mx-auto mb-4 h-1 w-10 rounded-full bg-white/30"
              (touchstart)="onDragStart($event)"
              (touchmove)="onDragMove($event)"
              (touchend)="onDragEnd()"
            ></div>
          }

          <div class="mb-4 flex items-center justify-between">
            <h3 data-testid="bottom-sheet-title" class="text-lg font-semibold text-white">
              {{ title() }}
            </h3>
            <button
              data-testid="bottom-sheet-close"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
              (click)="close()"
              aria-label="Fermer"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <ng-content />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent {
  readonly open = input(false);

  readonly title = input('');

  readonly openChange = output<boolean>();

  private readonly breakpointService = inject(BreakpointService);

  readonly isMobile = this.breakpointService.isMobile;

  readonly panelClasses = computed(() => {
    return this.isMobile()
      ? 'max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/20 bg-gray-900/95 p-4 backdrop-blur-lg'
      : 'rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md';
  });

  readonly panelRef = viewChild<ElementRef<HTMLElement>>('panelRef');

  private dragStartY = 0;
  private currentTranslateY = 0;

  close(): void {
    this.openChange.emit(false);
  }

  onDragStart(event: TouchEvent): void {
    this.dragStartY = event.touches[0].clientY;
  }

  onDragMove(event: TouchEvent): void {
    const deltaY = event.touches[0].clientY - this.dragStartY;
    if (deltaY > 0) {
      this.currentTranslateY = deltaY;
      const panel = this.panelRef()?.nativeElement;
      if (panel) {
        panel.style.transform = `translateY(${deltaY}px)`;
      }
    }
  }

  onDragEnd(): void {
    const panel = this.panelRef()?.nativeElement;
    if (this.currentTranslateY > 100) {
      this.close();
    } else if (panel) {
      panel.style.transform = '';
    }
    this.currentTranslateY = 0;
  }
}
