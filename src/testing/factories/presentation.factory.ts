import { of } from 'rxjs';
import type {
  PresentationInteractionsResponse,
  PresentationPort,
} from '../../app/core/ports/presentation.port';

export function buildInteractionsResponse(
  overrides?: Partial<PresentationInteractionsResponse>,
): PresentationInteractionsResponse {
  return {
    slug: 'ia-solopreneurs',
    interactions: {},
    ...overrides,
  };
}

export function createPresentationPortStub(
  response: PresentationInteractionsResponse = buildInteractionsResponse(),
): jasmine.SpyObj<PresentationPort> {
  const stub = jasmine.createSpyObj<PresentationPort>('PresentationPort', ['getInteractions']);
  stub.getInteractions.and.returnValue(of(response));
  return stub;
}
