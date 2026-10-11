import type { DestroyRef, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, type Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { estObjet } from '../../../../cours/runtime/core/valeurs';
import type { PresentationPort } from '../../../core/ports/presentation.port';

export interface ChargementInteraction<T> {
  readonly enLigne: T | null;
  readonly port: PresentationPort | null;
  readonly slug: string;
  readonly type: string;
  readonly interactionId: string;
  readonly cible: WritableSignal<T | null>;
  readonly erreur: WritableSignal<boolean>;
  readonly destroyRef: DestroyRef;
}

export interface FlatInteraction {
  slideId: string;
  type: string;
  id?: string;
  [key: string]: unknown;
}

export function flattenInteractions(source: Observable<unknown>): Observable<FlatInteraction[]> {
  return source.pipe(map((value) => normaliseInteractions(value)));
}

export function loadInteraction<T>(
  source$: Observable<unknown>,
  type: string,
  interactionId: string,
  onError: () => void,
): Observable<T | null> {
  return flattenInteractions(source$).pipe(
    catchError(() => {
      onError();
      return of([] as FlatInteraction[]);
    }),
    map((list) => {
      const found = list.find(
        (i) => i.type === type && (i.id === interactionId || i.slideId === interactionId),
      );
      return found ? (found as unknown as T) : null;
    }),
  );
}

export function chargerInteraction<T>(chargement: ChargementInteraction<T>): void {
  if (chargement.enLigne !== null) {
    chargement.cible.set(chargement.enLigne);
    return;
  }
  if (chargement.port === null) {
    chargement.erreur.set(true);
    return;
  }
  loadInteraction<T>(
    chargement.port.getInteractions(chargement.slug),
    chargement.type,
    chargement.interactionId,
    () => chargement.erreur.set(true),
  )
    .pipe(takeUntilDestroyed(chargement.destroyRef))
    .subscribe((found) => found && chargement.cible.set(found));
}

function normaliseInteractions(value: unknown): FlatInteraction[] {
  if (Array.isArray(value)) {
    return fromFlatList(value);
  }
  if (!estObjet(value)) {
    return [];
  }
  const interactions = value['interactions'];
  return estObjet(interactions) ? fromGroupedBySlide(interactions) : [];
}

function versInteraction(slideId: string, item: Record<string, unknown>): FlatInteraction {
  return { slideId, type: stringField(item, 'type'), ...item } as FlatInteraction;
}

function fromFlatList(items: readonly unknown[]): FlatInteraction[] {
  return items.filter(estObjet).map((item) => versInteraction(flatSlideIdOf(item), item));
}

function fromGroupedBySlide(interactions: Record<string, unknown>): FlatInteraction[] {
  return Object.entries(interactions).flatMap(([slideId, slideInteractions]) =>
    estObjet(slideInteractions) ? fromSlideBuckets(slideId, slideInteractions) : [],
  );
}

function fromSlideBuckets(
  slideId: string,
  slideInteractions: Record<string, unknown>,
): FlatInteraction[] {
  return (['present', 'scroll'] as const).flatMap((bucket) => {
    const list = slideInteractions[bucket];
    if (!Array.isArray(list)) {
      return [];
    }
    return list.filter(estObjet).map((item) => versInteraction(slideId, item));
  });
}

function flatSlideIdOf(item: Record<string, unknown>): string {
  if (typeof item['slideId'] === 'string') {
    return item['slideId'];
  }
  return stringField(item, 'id');
}

function stringField(item: Record<string, unknown>, key: string): string {
  const value = item[key];
  return typeof value === 'string' ? value : '';
}
