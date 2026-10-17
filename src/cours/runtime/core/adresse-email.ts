const LONGUEUR_MAX_D_UNE_ADRESSE = 254;
const OCTETS_MAX_DE_LA_PARTIE_LOCALE = 64;
const OCTETS_MAX_DU_DOMAINE = 254;
const LONGUEUR_MAX_D_UN_LABEL = 63;

const MORCEAU_DE_PARTIE_LOCALE = /^[a-z\d!#$%&'*+\-/=?^_`{|}~¡-퟿豈-﷏ﷰ-￯]+$/i;
const DOMAINE_DE_PREMIER_NIVEAU = /^([a-z¡-¨ª-퟿豈-﷏ﷰ-￯]{2,}|xn[a-z0-9-]{2,})$/i;
const LABEL_DE_DOMAINE = /^[a-z_¡-￿0-9-]+$/i;
const CARACTERE_PLEINE_CHASSE = /[！-～]/;
const CARACTERE_INVISIBLE = /[\p{C}\p{Z}]/u;

function octets(texte: string): number {
  return encodeURI(texte).split(/%..|./).length - 1;
}

function estUnLabelDeDomaine(label: string): boolean {
  return (
    label.length <= LONGUEUR_MAX_D_UN_LABEL &&
    LABEL_DE_DOMAINE.test(label) &&
    !CARACTERE_PLEINE_CHASSE.test(label) &&
    !/^-|-$/.test(label) &&
    !label.includes('_')
  );
}

function estUnDomaineComplet(domaine: string): boolean {
  const labels = domaine.split('.');
  const premierNiveau = labels[labels.length - 1];
  return (
    labels.length >= 2 &&
    DOMAINE_DE_PREMIER_NIVEAU.test(premierNiveau) &&
    !/\s/.test(premierNiveau) &&
    labels.every(estUnLabelDeDomaine)
  );
}

function estUnePartieLocale(partieLocale: string): boolean {
  return partieLocale.split('.').every((morceau) => MORCEAU_DE_PARTIE_LOCALE.test(morceau));
}

export function estUneAdresseEmail(adresse: string): boolean {
  if (adresse.length > LONGUEUR_MAX_D_UNE_ADRESSE || CARACTERE_INVISIBLE.test(adresse)) {
    return false;
  }
  const parties = adresse.split('@');
  const domaine = parties.pop() ?? '';
  const partieLocale = parties.join('@');
  return (
    octets(partieLocale) <= OCTETS_MAX_DE_LA_PARTIE_LOCALE &&
    octets(domaine) <= OCTETS_MAX_DU_DOMAINE &&
    estUnDomaineComplet(domaine) &&
    estUnePartieLocale(partieLocale)
  );
}
