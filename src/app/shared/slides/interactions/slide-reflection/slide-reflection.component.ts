import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, of, type Observable } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";

interface ReflectionInteraction {
  id: string;
  type: "reflection";
  prompt: string;
  placeholder?: string;
}

/**
 * Affiche une question ouverte avec textarea + bouton de sauvegarde locale.
 * La saisie reste cliente — pas de transit réseau.
 */
@Component({
  selector: "app-slide-reflection",
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./slide-reflection.component.html",
  styleUrl: "./slide-reflection.component.scss",
})
export class SlideReflectionComponent {
  readonly slug = input.required<string>();
  readonly interactionId = input.required<string>();

  protected readonly reflection = signal<ReflectionInteraction | null>(null);
  protected readonly error = signal<boolean>(false);
  protected readonly value = signal<string>("");
  protected readonly saved = signal<boolean>(false);

  private readonly port = inject(PRESENTATION_PORT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    queueMicrotask(() => this.load());
  }

  protected save(): void {
    if (this.value().trim().length === 0) {
      return;
    }
    this.saved.set(true);
  }

  protected onInput(text: string): void {
    this.value.set(text);
    if (this.saved()) {
      this.saved.set(false);
    }
  }

  private load(): void {
    (
      this.port.getInteractions(this.slug()) as unknown as Observable<
        ReflectionInteraction[]
      >
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error.set(true);
          return of([] as ReflectionInteraction[]);
        }),
      )
      .subscribe((list) => {
        const found = list.find(
          (i) => i.id === this.interactionId() && i.type === "reflection",
        );
        if (found) {
          this.reflection.set(found);
        }
      });
  }
}
