import { chaineDe } from '../../../cours/runtime/core/texte/valeurs';
import { ENTREPRISE_DU_SITE, LANGUE_SERVIE } from '../../core/seo/site-servi';

export interface CoordonneesDuSite {
  email: string;
  mailto: string;
  telephone: string;
  tel: string;
  adresse: string;
  bureau: string;
  carte: string;
  reseaux: readonly string[];
}

const coordonnee = (bloc: unknown, cle: string, chemin = cle): string => {
  const valeur = chaineDe(bloc, cle);
  if (valeur === null) throw new Error(`coordonnée absente : localBusiness.${chemin}`);
  return valeur;
};

const telephoneLisible = (numero: string): string =>
  numero.replace(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, '+33 $1 $2 $3 $4 $5');

export const coordonneesDe = (
  entreprise: Record<string, unknown>,
  langue: string,
): CoordonneesDuSite => {
  const adresse = entreprise['address'];
  const champ = (cle: string): string => coordonnee(adresse, cle, `address.${cle}`);
  const [rue, codePostal, ville, codeDuPays] = [
    champ('streetAddress'),
    champ('postalCode'),
    champ('addressLocality'),
    champ('addressCountry'),
  ];
  const pays = new Intl.DisplayNames([langue], { type: 'region' }).of(codeDuPays) ?? codeDuPays;
  const email = coordonnee(entreprise, 'email');
  const telephone = coordonnee(entreprise, 'telephone');
  const reseaux = entreprise['sameAs'];
  return {
    email,
    mailto: `mailto:${email}`,
    telephone: telephoneLisible(telephone),
    tel: `tel:${telephone}`,
    adresse: `${rue}, ${codePostal} ${ville}, ${pays}`,
    bureau: `${ville}, ${codePostal}, ${pays}`,
    carte: coordonnee(entreprise, 'hasMap'),
    reseaux: Array.isArray(reseaux) ? reseaux.filter((url) => typeof url === 'string') : [],
  };
};

export const profilSur = (coordonnees: CoordonneesDuSite, reseau: string): string => {
  const profil = coordonnees.reseaux.find((url) => new URL(url).hostname.endsWith(reseau));
  if (profil === undefined) throw new Error(`réseau absent de localBusiness.sameAs : ${reseau}`);
  return profil;
};

export const COORDONNEES_DU_SITE = coordonneesDe(ENTREPRISE_DU_SITE, LANGUE_SERVIE);
