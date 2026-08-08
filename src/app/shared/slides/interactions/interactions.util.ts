import { of, type Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

function normaliseInteractions(value: unknown): FlatInteraction[] {
  if (Array.isArray(value)) {
    return fromFlatList(value);
  }
  if (!isRecord(value)) {
    return [];
  }
  const interactions = value['interactions'];
  return isRecord(interactions) ? fromGroupedBySlide(interactions) : [];
}

function fromFlatList(items: readonly unknown[]): FlatInteraction[] {
  return items.filter(isRecord).map(
    (item) =>
      ({
        slideId: flatSlideIdOf(item),
        type: stringField(item, 'type'),
        ...item,
      }) as FlatInteraction,
  );
}

function fromGroupedBySlide(interactions: Record<string, unknown>): FlatInteraction[] {
  return Object.entries(interactions).flatMap(([slideId, slideInteractions]) =>
    isRecord(slideInteractions) ? fromSlideBuckets(slideId, slideInteractions) : [],
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
    return list.filter(isRecord).map(
      (item) =>
        ({
          slideId,
          type: stringField(item, 'type'),
          ...item,
        }) as FlatInteraction,
    );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
