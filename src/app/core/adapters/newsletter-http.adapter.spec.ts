import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { bancAdaptateurHttp, verifierPostRelaye } from '../../../testing/http/http-attendu';
import type { SubscribeNewsletterRequestDto } from '../../../../contrat/types.gen';
import { NewsletterHttpAdapter } from './newsletter-http.adapter';

const JETON = 'c'.repeat(64);

describe('NewsletterHttpAdapter', () => {
  const banc = bancAdaptateurHttp(NewsletterHttpAdapter);

  it('NL-01 · envoie la demande d abonnement et lit le message servi', () => {
    const demande: SubscribeNewsletterRequestDto = {
      website: '',
      formFillDurationMs: 4200,
      email: 'jane@mail.com',
      locale: 'en',
      termsVersion: '2026-11-12',
    };

    verifierPostRelaye(
      banc.adapter.sAbonner(demande),
      banc.httpMock,
      '/newsletter/subscribe',
      demande,
      {
        message:
          'Si cette adresse peut recevoir la newsletter, un email de confirmation vient de partir.',
      },
    );
  });

  const LIENS: readonly {
    readonly geste: string;
    readonly appel: (adaptateur: NewsletterHttpAdapter) => Observable<unknown>;
    readonly chemin: string;
    readonly reponse: object;
  }[] = [
    {
      geste: 'confirmer',
      appel: (adaptateur) => adaptateur.confirmer(JETON),
      chemin: '/newsletter/confirm',
      reponse: { status: 'confirmed', locale: 'en' },
    },
    {
      geste: 'se desabonner',
      appel: (adaptateur) => adaptateur.seDesabonner(JETON),
      chemin: '/newsletter/unsubscribe',
      reponse: { status: 'unsubscribed' },
    },
  ];

  for (const { geste, appel, chemin, reponse } of LIENS) {
    it(`NL-03 NL-05 · ${geste} envoie le jeton du lien en parametre`, () => {
      const recues: unknown[] = [];
      appel(banc.adapter).subscribe((resultat) => recues.push(resultat));

      const requete = banc.httpMock.expectOne(`${environment.apiBaseUrl}${chemin}?token=${JETON}`);
      expect(requete.request.method).toBe('POST');
      requete.flush(reponse);

      expect(recues).toEqual([reponse]);
    });
  }
});
