import { of, type Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

/**
 * Interaction normalisee aplatie consommee par les composants
 * `slide-quiz`, `slide-poll`, `slide-reflection`. On expose `slideId`
 * (id de la slide qui contient l'interaction) et `type` afin que les
 * composants puissent matcher leur cible via `(interactionId, type)`.
 *
 * Le reste des champs (`question`, `options`, `placeholder`, etc.) est
 * conserve tel quel via une signature index permissive — chaque composant
 * downcaste vers sa shape specifique apres detection du `type`.
 */
export interface FlatInteraction {
  /** Id stable de la slide hote — utilise pour matcher `interactionId`. */
  slideId: string;
  /** Type d'interaction discriminant (poll, reflection, checklist, etc.). */
  type: string;
  /** Id optionnel transporte par l'interaction (legacy stubs flat). */
  id?: string;
  [key: string]: unknown;
}

/**
 * Shape backend reelle expose par `PresentationPort.getInteractions` :
 * `{ slug, interactions: Record<slideId, { present?: [...], scroll?: [...] }> }`.
 *
 * Les composants quiz/poll/reflection consomment cependant une liste plate.
 * Cet util adapte la reponse port vers une liste plate stable, tout en
 * tolerant la shape legacy `Array<FlatInteraction>` deja utilisee dans les
 * stubs de tests existants.
 *
 * @param source Observable du port (ou stub flat).
 * @returns Observable d'une liste plate normalisee.
 */
export function flattenInteractions(
  source: Observable<unknown>,
): Observable<FlatInteraction[]> {
  return source.pipe(map((value) => normaliseInteractions(value)));
}

/**
 * Charge une interaction unique depuis la reponse du port et la downcaste
 * vers la shape `T` attendue par le composant appelant.
 *
 * Mutualise le pipeline partage par `slide-quiz`, `slide-poll` et
 * `slide-reflection` :
 * 1. aplatit la reponse via {@link flattenInteractions} ;
 * 2. en cas d'erreur de la source, appelle `onError` (degradation gracieuse)
 *    et substitue une liste vide ;
 * 3. selectionne la premiere interaction dont le `type` correspond et dont
 *    l'`id` legacy *ou* le `slideId` derive correspond a `interactionId` ;
 * 4. downcaste le resultat vers `T` (ou `null` si rien ne correspond).
 *
 * Le comportement est strictement identique a l'ancien `load()` duplique
 * dans chaque composant.
 *
 * @param source$ Observable du port (`PresentationPort.getInteractions`).
 * @param type Type discriminant recherche (`quiz`, `poll`, `reflection`...).
 * @param interactionId Id cible (matche `id` legacy ou `slideId`).
 * @param onError Callback declenchee si la source emet une erreur.
 * @returns Observable de l'interaction trouvee (castee `T`) ou `null`.
 */
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
        (i) =>
          i.type === type &&
          (i.id === interactionId || i.slideId === interactionId),
      );
      return found ? (found as unknown as T) : null;
    }),
  );
}

function normaliseInteractions(value: unknown): FlatInteraction[] {
  if (Array.isArray(value)) {
    // Legacy flat shape (stubs): on ajoute `slideId = id` quand absent
    // pour que le matching reste compatible cote composant.
    return value
      .filter((item): item is Record<string, unknown> => isRecord(item))
      .map((item) => ({
        slideId:
          typeof item["slideId"] === "string"
            ? (item["slideId"] as string)
            : typeof item["id"] === "string"
              ? (item["id"] as string)
              : "",
        type: typeof item["type"] === "string" ? (item["type"] as string) : "",
        ...item,
      })) as FlatInteraction[];
  }

  if (!isRecord(value)) {
    return [];
  }

  const interactions = value["interactions"];
  if (!isRecord(interactions)) {
    return [];
  }

  const out: FlatInteraction[] = [];
  for (const [slideId, slideInteractions] of Object.entries(interactions)) {
    if (!isRecord(slideInteractions)) {
      continue;
    }
    for (const bucket of ["present", "scroll"] as const) {
      const list = slideInteractions[bucket];
      if (!Array.isArray(list)) {
        continue;
      }
      for (const item of list) {
        if (!isRecord(item)) {
          continue;
        }
        const type =
          typeof item["type"] === "string" ? (item["type"] as string) : "";
        out.push({
          slideId,
          type,
          ...item,
        } as FlatInteraction);
      }
    }
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
