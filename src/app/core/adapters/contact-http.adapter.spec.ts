import {
  bancAdaptateurHttp,
  verifierErreurRelayee,
  verifierPostRelaye,
} from '../../../testing/http-attendu';
import { lecturesStrictes } from '../../../testing/lecture-stricte';
import type { ContactFormState } from '../models/contact.model';
import { ContactHttpAdapter } from './contact-http.adapter';

const DEMANDE_MINIMALE: ContactFormState = {
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  subject: 'Test',
  message: 'Test message',
  role: 'other',
  terms: true,
};

describe('ContactHttpAdapter', () => {
  const banc = bancAdaptateurHttp(ContactHttpAdapter);

  describe('lecture des réponses servies par le back', () => {
    lecturesStrictes(banc, [
      {
        route: 'POST /api/contacts',
        chemin: '/contacts',
        appel: (a) => a.contact(DEMANDE_MINIMALE),
      },
    ]);
  });

  it('should POST contact form data to the contacts endpoint', () => {
    const payload: ContactFormState = {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33123456789',
      subject: 'Collaboration',
      message: 'Bonjour, je souhaite collaborer.',
      role: 'developer',
      terms: true,
      termsVersion: '2026-02-11',
      termsLocale: 'fr',
      termsAcceptedAt: '2026-03-01T10:00:00Z',
      termsMethod: 'checkbox',
    };
    const response = {
      message: 'Message envoyé avec succès.',
      httpCode: 201,
    };

    verifierPostRelaye(
      banc.adapter.contact(payload),
      banc.httpMock,
      '/contacts',
      payload,
      response,
    );
  });

  it('should propagate HTTP errors', () => {
    verifierErreurRelayee(banc.adapter.contact(DEMANDE_MINIMALE), banc.httpMock, '/contacts', {
      corps: 'Validation error',
      status: 422,
      statusText: 'Unprocessable Entity',
    });
  });
});
