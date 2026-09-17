import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  computed,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import { loadInteraction } from '../interactions.util';

export interface ReflectionInteraction {
  id?: string;
  slideId?: string;
  type: 'reflection';
  question?: string;
  prompt?: string;
  placeholder?: string;
  context?: string;
  competency?: string;
  expected?: string;
  nextAction?: string;
}

@Component({
  selector: 'app-slide-reflection',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-reflection.component.html',
  styleUrl: './slide-reflection.component.scss',
})
export class SlideReflectionComponent implements OnInit {
  readonly slug = input<string>('');
  readonly interactionId = input<string>('');
  readonly promptData = input<ReflectionInteraction | null>(null);
  readonly showCompetency = input<boolean>(false);

  protected readonly reflection = signal<ReflectionInteraction | null>(null);
  protected readonly activeReflection = computed(() => this.promptData() ?? this.reflection());
  protected readonly error = signal<boolean>(false);
  protected readonly value = signal<string>('');
  protected readonly saved = signal<boolean>(false);

  private readonly port = inject(PRESENTATION_PORT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
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

  protected promptText(): string {
    const r = this.activeReflection();
    if (r === null) return '';
    return r.question ?? r.prompt ?? '';
  }

  private load(): void {
    const inline = this.promptData();
    if (inline !== null) {
      this.reflection.set(inline);
      return;
    }
    if (this.port === null) {
      this.error.set(true);
      return;
    }
    loadInteraction<ReflectionInteraction>(
      this.port.getInteractions(this.slug()),
      'reflection',
      this.interactionId(),
      () => this.error.set(true),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((found) => found && this.reflection.set(found));
  }
}
