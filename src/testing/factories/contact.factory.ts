import { of } from 'rxjs';
import type { ContactPort } from '../../app/core/ports/contact.port';

function createContactPortStub(): jasmine.SpyObj<ContactPort> {
  return jasmine.createSpyObj<ContactPort>('ContactPort', ['contact']);
}

export function createContactPortStubWithDefault(): jasmine.SpyObj<ContactPort> {
  const stub = createContactPortStub();
  stub.contact.and.returnValue(of({ message: 'ok', httpCode: 200 }));
  return stub;
}
