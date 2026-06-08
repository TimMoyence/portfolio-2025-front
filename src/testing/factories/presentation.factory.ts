import { of } from "rxjs";
import type {
  PresentationInteractionsResponse,
  PresentationPort,
} from "../../app/core/ports/presentation.port";

/**
 * Construit une `PresentationInteractionsResponse` avec des valeurs par
 * defaut (slug `ia-solopreneurs`, aucune interaction). Respecte la shape
 * reelle du contrat `PresentationPort.getInteractions` :
 * `{ slug, interactions: Record<slideId, SlideInteractions> }`.
 */
export function buildInteractionsResponse(
  overrides?: Partial<PresentationInteractionsResponse>,
): PresentationInteractionsResponse {
  return {
    slug: "ia-solopreneurs",
    interactions: {},
    ...overrides,
  };
}

/**
 * Cree un stub espionne du port `PRESENTATION_PORT`.
 *
 * `getInteractions` retourne la reponse fournie (ou un defaut vide) enveloppee
 * dans un Observable synchrone. Remplace les stubs inline qui violaient le
 * contrat (`of([])`) ou recouraient a un cast `as unknown as PresentationPort`.
 *
 * @param response Reponse a retourner (defaut: `buildInteractionsResponse()`).
 */
export function createPresentationPortStub(
  response: PresentationInteractionsResponse = buildInteractionsResponse(),
): jasmine.SpyObj<PresentationPort> {
  const stub = jasmine.createSpyObj<PresentationPort>("PresentationPort", [
    "getInteractions",
  ]);
  stub.getInteractions.and.returnValue(of(response));
  return stub;
}
