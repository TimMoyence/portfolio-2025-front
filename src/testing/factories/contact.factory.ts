import { of } from 'rxjs';
import type { ContactResponseDto } from '../../../contrat/types.gen';
import type { ContactPort } from '../../app/core/ports/contact.port';

const accuse = (message = 'ok'): ContactResponseDto => ({ message, httpCode: 201 });

function createContactPortStub(): jasmine.SpyObj<ContactPort> {
  return jasmine.createSpyObj<ContactPort>('ContactPort', ['contact']);
}

export function createContactPortStubWithDefault(): jasmine.SpyObj<ContactPort> {
  const stub = createContactPortStub();
  stub.contact.and.returnValue(of(accuse()));
  return stub;
}
