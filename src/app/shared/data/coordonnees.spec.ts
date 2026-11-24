import { ContactCtaComponent } from '../components/sections/cta-contact/cta-contact.component';
import { CONTACT_METHODS } from './contact-methods';
import { coordonneesDe, profilSur } from './coordonnees';

const CARTE_DE_PESSAC = 'https://www.google.com/maps/place/Pessac';
const CARTE_DU_SITE =
  'https://www.google.com/maps/place/Allée+Serr,+33100+Bordeaux,+France/@44.8353083,-0.5750133,17z/data=!3m1!4b1!4m6!3m5!1s0xd5527dace2f6b7f:0x8c6f3e3f8a4f4e2!8m2!3d44.8353042!4d-0.5728246!16s%2Fg%2F11c52_5y9r';

const atelier = (surcharges: Record<string, unknown> = {}): Record<string, unknown> => ({
  telephone: '+33556123456',
  email: 'bonjour@atelier-riviere.fr',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '12 rue des Lilas',
    addressLocality: 'Pessac',
    postalCode: '33600',
    addressCountry: 'FR',
  },
  hasMap: CARTE_DE_PESSAC,
  sameAs: [
    'https://www.linkedin.com/in/camille-riviere',
    'https://www.facebook.com/atelier.riviere/',
  ],
  ...surcharges,
});

describe('SEO-6 · les coordonnées affichées se lisent dans l entreprise du référencement', () => {
  it('SEO-6 · e-mail, téléphone lisible, adresse, bureau et carte se déduisent de l entreprise', () => {
    expect(coordonneesDe(atelier(), 'fr')).toEqual({
      email: 'bonjour@atelier-riviere.fr',
      mailto: 'mailto:bonjour@atelier-riviere.fr',
      telephone: '+33 5 56 12 34 56',
      tel: 'tel:+33556123456',
      adresse: '12 rue des Lilas, 33600 Pessac, France',
      bureau: 'Pessac, 33600, France',
      carte: CARTE_DE_PESSAC,
      reseaux: [
        'https://www.linkedin.com/in/camille-riviere',
        'https://www.facebook.com/atelier.riviere/',
      ],
    });
  });

  it('SEO-6 · le pays se nomme dans la langue servie', () => {
    const belge = atelier({
      address: {
        streetAddress: 'Rue Haute 3',
        addressLocality: 'Liège',
        postalCode: '4000',
        addressCountry: 'BE',
      },
    });

    expect(coordonneesDe(belge, 'fr').bureau).toBe('Liège, 4000, Belgique');
    expect(coordonneesDe(belge, 'en').bureau).toBe('Liège, 4000, Belgium');
  });

  it('SEO-6 · un numéro hors de France s affiche tel qu il est écrit', () => {
    const coordonnees = coordonneesDe(atelier({ telephone: '+32470123456' }), 'fr');

    expect(coordonnees.telephone).toBe('+32470123456');
    expect(coordonnees.tel).toBe('tel:+32470123456');
  });

  it('SEO-6 · une coordonnée absente est refusée', () => {
    expect(() => coordonneesDe(atelier({ telephone: undefined }), 'fr')).toThrowError(
      'coordonnée absente : localBusiness.telephone',
    );
    expect(() => coordonneesDe(atelier({ address: {} }), 'fr')).toThrowError(
      'coordonnée absente : localBusiness.address.streetAddress',
    );
  });

  it('SEO-6 · un profil se trouve par son réseau, et un réseau absent est refusé', () => {
    const coordonnees = coordonneesDe(atelier(), 'fr');

    expect(profilSur(coordonnees, 'linkedin.com')).toBe(
      'https://www.linkedin.com/in/camille-riviere',
    );
    expect(() => profilSur(coordonnees, 'instagram.com')).toThrowError(
      'réseau absent de localBusiness.sameAs : instagram.com',
    );
  });

  it('SEO-6 · les moyens de contact et la carte du site viennent de l entreprise servie', () => {
    expect(CONTACT_METHODS.map(({ value, href }) => [value, href])).toEqual([
      ['moyencet@gmail.com', 'mailto:moyencet@gmail.com'],
      ['+33 6 98 50 32 82', 'tel:+33698503282'],
      ['Bordeaux, 33100, France', CARTE_DU_SITE],
    ]);
    expect(CONTACT_METHODS.some((methode) => 'schemaProp' in methode)).toBeFalse();
    expect(new ContactCtaComponent().map.href).toBe(CARTE_DU_SITE);
  });
});
