import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { PRESENTATION_PORT } from '../../../../core/ports/presentation.port';
import { chargerInteraction } from '../interactions.util';

interface PollInteraction {
  id?: string;
  slideId?: string;
  type: 'poll';
  question: string;
  options: string[];
}

@Component({
  selector: 'app-slide-poll',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slide-poll.component.html',
  styleUrl: './slide-poll.component.scss',
})
export class SlidePollComponent implements OnInit {
  readonly slug = input.required<string>();
  readonly interactionId = input.required<string>();

  protected readonly poll = signal<PollInteraction | null>(null);
  protected readonly error = signal<boolean>(false);
  protected readonly votedIndex = signal<number | null>(null);
  protected readonly hasVoted = computed(() => this.votedIndex() !== null);

  protected readonly votedLabel = computed(() => {
    const index = this.votedIndex();
    const current = this.poll();
    if (index === null || current === null) {
      return null;
    }
    return current.options[index] ?? null;
  });

  private readonly port = inject(PRESENTATION_PORT);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.load();
  }

  protected vote(index: number): void {
    if (this.hasVoted()) {
      return;
    }
    this.votedIndex.set(index);
  }

  private load(): void {
    chargerInteraction<PollInteraction>({
      enLigne: null,
      port: this.port,
      slug: this.slug(),
      type: 'poll',
      interactionId: this.interactionId(),
      cible: this.poll,
      erreur: this.error,
      destroyRef: this.destroyRef,
    });
  }
}
