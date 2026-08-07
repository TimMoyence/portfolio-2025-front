import { of } from 'rxjs';
import type { ContactFormState } from '../../app/core/models/contact.model';
import type { ContactPort } from '../../app/core/ports/contact.port';

export function buildContactPayload(overrides?: Partial<ContactFormState>): ContactFormState {
  return {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    subject: 'Collaboration',
    message: 'Bonjour, je souhaite collaborer.',
    role: 'developer',
    terms: true,
    ...overrides,
  };
}

export function createContactPortStub(): jasmine.SpyObj<ContactPort> {
  return jasmine.createSpyObj<ContactPort>('ContactPort', ['contact']);
}

export function createContactPortStubWithDefault(): jasmine.SpyObj<ContactPort> {
  const stub = createContactPortStub();
  stub.contact.and.returnValue(of({ message: 'ok', httpCode: 200 }));
  return stub;
}
