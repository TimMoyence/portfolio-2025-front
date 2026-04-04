import { animate, style, transition, trigger } from "@angular/animations";
import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from "@angular/core";

/**
 * Bottom sheet generique mobile-first.
 * Mobile : slide-up depuis le bas avec backdrop et drag-to-dismiss.
 * Desktop (md+) : panel inline expand.
 * ARIA : role="dialog", aria-modal="true", Escape pour fermer.
 */
@Component({
  selector: "app-bottom-sheet",
  standalone: true,
  animations: [
    trigger("panelAnimation", [
      // Entree mobile : slide-up
      transition("void => mobile", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate(
          "300ms ease-out",
          style({ transform: "translateY(0)", opacity: 1 }),
        ),
      ]),
      transition("mobile => void", [
        animate(
          "200ms ease-in",
          style({ transform: "translateY(100%)", opacity: 0 }),
        ),
      ]),
      // Entree desktop : fade-in
      transition("void => desktop", [
        style({ opacity: 0 }),
        animate("200ms ease-out", style({ opacity: 1 })),
      ]),
      transition("desktop => void", [
        animate("150ms ease-in", style({ opacity: 0 })),
      ]),
    ]),
    trigger("fadeIn", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate("200ms ease-out", style({ opacity: 1 })),
      ]),
      transition(":leave", [animate("150ms ease-in", style({ opacity: 0 }))]),
    ]),
  ],
  host: { class: "block" },
  template: `
    @if (open()) {
      <!-- Mobile : backdrop fixe -->
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

      <!-- Panel : slide-up mobile / inline desktop -->
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
          <!-- Barre de drag (mobile uniquement) -->
          @if (isMobile()) {
            <div
              class="mx-auto mb-4 h-1 w-10 rounded-full bg-white/30"
              (touchstart)="onDragStart($event)"
              (touchmove)="onDragMove($event)"
              (touchend)="onDragEnd()"
            ></div>
          }

          <!-- Header -->
          <div class="mb-4 flex items-center justify-between">
            <h3
              data-testid="bottom-sheet-title"
              class="text-lg font-semibold text-white"
            >
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
  /** Controle l'ouverture du bottom sheet. */
  readonly open = input(false);

  /** Titre affiche dans le header. */
  readonly title = input("");

  /** Emis quand l'etat ouvert/ferme change (two-way binding). */
  readonly openChange = output<boolean>();

  private readonly platformId = inject(PLATFORM_ID);

  /** Detecte si on est en mode mobile (< 768px). */
  readonly isMobile = computed(() => {
    if (!isPlatformBrowser(this.platformId)) return false;
    return this._isMobile();
  });

  /** Classes CSS du panel selon le mode mobile/desktop. */
  readonly panelClasses = computed(() => {
    return this.isMobile()
      ? "max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/20 bg-gray-900/95 p-4 backdrop-blur-lg"
      : "rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md";
  });

  private readonly _isMobile = signal(false);

  readonly panelRef = viewChild<ElementRef<HTMLElement>>("panelRef");

  private dragStartY = 0;
  private currentTranslateY = 0;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const mq = window.matchMedia("(max-width: 768px)");
      this._isMobile.set(mq.matches);
      mq.addEventListener("change", (e) => this._isMobile.set(e.matches));
    }
  }

  /** Ferme le bottom sheet. */
  close(): void {
    this.openChange.emit(false);
  }

  /** Demarre le drag-to-dismiss sur mobile. */
  onDragStart(event: TouchEvent): void {
    this.dragStartY = event.touches[0].clientY;
  }

  /** Suivi du mouvement de drag. */
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

  /** Finalise le drag : ferme si > 100px, sinon revient en place. */
  onDragEnd(): void {
    const panel = this.panelRef()?.nativeElement;
    if (this.currentTranslateY > 100) {
      this.close();
    } else if (panel) {
      panel.style.transform = "";
    }
    this.currentTranslateY = 0;
  }
}
