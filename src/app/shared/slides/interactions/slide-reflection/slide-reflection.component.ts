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
import { catchError, of } from "rxjs";
import { PRESENTATION_PORT } from "../../../../core/ports/presentation.port";
import {
  flattenInteractions,
  type FlatInteraction,
} from "../interactions.util";

interface ReflectionInteraction {
  id?: string;
  slideId?: string;
  type: "reflection";
  /** Texte de la question. Champ legacy `prompt` toujours supporte. */
  question?: string;
  prompt?: string;
  placeholder?: string;
}

/**
 * Affiche une question ouverte avec textarea + bouton de sauvegarde locale.
 * La saisie reste cliente — pas de transit reseau.
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

  /**
   * Renvoie le texte de la question — l'API reelle utilise `question`,
   * tandis que les stubs legacy de tests utilisent `prompt`. On expose
   * un seul accessor pour la couche template.
   */
  protected promptText(): string {
    const r = this.reflection();
    if (r === null) return "";
    return r.question ?? r.prompt ?? "";
  }

  private load(): void {
    flattenInteractions(this.port.getInteractions(this.slug()))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.error.set(true);
          return of([] as FlatInteraction[]);
        }),
      )
      .subscribe((list) => {
        const target = this.interactionId();
        const found = list.find(
          (i) =>
            i.type === "reflection" &&
            (i.id === target || i.slideId === target),
        );
        if (found) {
          this.reflection.set(found as unknown as ReflectionInteraction);
        }
      });
  }
}
