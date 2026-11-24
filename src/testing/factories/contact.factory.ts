import { of } from 'rxjs';
import type { ContactResponseDto } from '../../../contrat/types.gen';
import type { Provider } from '@angular/core';
import { CONTACT_PORT, type ContactPort } from '../../app/core/ports/contact.port';

const accuse = (message = 'ok'): ContactResponseDto => ({ message, httpCode: 201 });

function createContactPortStub(): jasmine.SpyObj<ContactPort> {
  return jasmine.createSpyObj<ContactPort>('ContactPort', ['contact']);
}

export function createContactPortStubWithDefault(): jasmine.SpyObj<ContactPort> {
  const stub = createContactPortStub();
  stub.contact.and.returnValue(of(accuse()));
  return stub;
}

export const CONTACT_PORT_PAR_DEFAUT: Provider = {
  provide: CONTACT_PORT,
  useFactory: createContactPortStubWithDefault,
};
