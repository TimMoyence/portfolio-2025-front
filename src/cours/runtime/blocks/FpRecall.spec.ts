import { attendreLeRenduEchappe } from '../../../testing/assertions-briques';
import {
  attendreLaSeuleOptionFausse,
  attributDOption,
  detailsEmis,
  installerBrique,
  noeudOmbre,
  noeudsOmbre,
  texteOmbre,
} from '../../../testing/banc-de-brique';
import { ROLES_DE_MONTAGE } from '../../../testing/briques-montees';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import {
  buildRecallQuestion,
  buildVerdictDeReponse,
} from '../../../testing/factories/cours.factory';
import { reculerLaPendule, UNE_HEURE_MS } from '../../../testing/horloge-simulee';
import { FpRecall } from './FpRecall';

interface DetailRecall {
  questionId: string;
  valeur: string;
  rappel: string;
  dureeMs: number;
}

const QUESTION = buildRecallQuestion();
const OPTIONS_AVEC_JE_NE_SAIS_PAS = QUESTION.options.length + 1;
const DELAI_DEFAUT_MS = 8000;
const INSTANT_INITIAL = '2026-09-12T09:00:00.000Z';
const LIBELLE_PREMIERE = 'On multiplie par (1 + i) puissance n';
const RAPPEL_ETUDIANT = 'On applique le taux chaque annee sur le capital deja augmente';
const CHARGE_XSS = '<img src=x onerror="alert(1)">';
const CORRIGE = { type: 'cible', cible: LIBELLE_PREMIERE, optionId: 'a' };

function champRappel(element: FpRecall): HTMLTextAreaElement {
  const champ = noeudOmbre<HTMLTextAreaElement>(element, 'rappel');
  if (champ === null) {
    throw new Error('champ de rappel absent');
  }
  return champ;
}

function saisirRappel(element: FpRecall, frappe: string): void {
  const champ = champRappel(element);
  champ.value = frappe;
  champ.dispatchEvent(new Event('input'));
}

function ordreAffiche(element: FpRecall): string[] {
  return noeudsOmbre(element, 'option').map((option) => option.getAttribute('data-option') ?? '');
}

function choisirLOption(element: FpRecall, option: string): void {
  noeudsOmbre<HTMLButtonElement>(element, 'option')
    .find((bouton) => bouton.getAttribute('data-option') === option)
    ?.click();
}

function soumissionsDe(element: FpRecall): DetailRecall[] {
  return detailsEmis(element, 'fp-recall-submit');
}

function attendreLesOptionsOuvertes(element: FpRecall): void {
  expect(noeudsOmbre<HTMLButtonElement>(element, 'option').length).toBe(
    OPTIONS_AVEC_JE_NE_SAIS_PAS,
  );
  expect(texteOmbre(element, 'compte-a-rebours')).toBe(
    'Choisissez maintenant la proposition qui correspond',
  );
}

describe('FpRecall', () => {
  let hote: FpRecall;

  installerBrique<FpRecall>({
    balise: 'fp-recall',
    classe: FpRecall,
    instant: INSTANT_INITIAL,
    poser: (brique) => {
      hote = brique;
      brique.question = QUESTION;
    },
  });

  it('presente l enonce et le champ de rappel libre des le depart', () => {
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(QUESTION.enonce);
    expect(champRappel(hote).value).toBe('');
  });

  const INSTANTS_MUETS = [0, 1000, 4000, 7999];

  for (const instant of INSTANTS_MUETS) {
    it(`ne met aucune option dans le dom a ${instant} ms de rappel`, () => {
      jasmine.clock().tick(instant);
      expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').length).toBe(0);
      expect(hote.shadowRoot?.innerHTML).not.toContain(LIBELLE_PREMIERE);
      for (const role of ROLES_DE_MONTAGE) {
        hote.setAttribute('data-cours-role', role);
        expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').length)
          .withContext(`role ${role}`)
          .toBe(0);
        expect(hote.shadowRoot?.innerHTML)
          .withContext(`role ${role}`)
          .not.toContain(LIBELLE_PREMIERE);
      }
    });
  }

  it('ne rend aucune option au tout premier affichage', () => {
    const neuve = document.createElement('fp-recall') as FpRecall;
    neuve.question = QUESTION;
    document.body.appendChild(neuve);
    expect(noeudsOmbre(neuve, 'option').length).toBe(0);
    expect(neuve.shadowRoot?.innerHTML).not.toContain(LIBELLE_PREMIERE);
    expect(texteOmbre(neuve, 'compte-a-rebours')).toBe(
      'Temps d’écriture libre : propositions de réponse dans 8 s',
    );
    neuve.remove();
  });

  it('fait apparaitre les options a la fin des huit secondes', () => {
    expect(hote.delaiMs).toBe(DELAI_DEFAUT_MS);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    attendreLesOptionsOuvertes(hote);
  });

  it('fait apparaitre les options a la fin des huit secondes meme si l horloge du poste recule d une heure', () => {
    reculerLaPendule(UNE_HEURE_MS);
    jasmine.clock().tick(DELAI_DEFAUT_MS);

    attendreLesOptionsOuvertes(hote);
  });

  it('respecte un delai configure a la place des huit secondes', () => {
    hote.delaiMs = 3000;
    jasmine.clock().tick(2999);
    expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').length).toBe(0);
    jasmine.clock().tick(1);
    expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').length).toBe(OPTIONS_AVEC_JE_NE_SAIS_PAS);
  });

  it('F02 · montre les options sans attendre quand le formateur les affiche', () => {
    hote.delaiMs = 30000;
    jasmine.clock().tick(1000);
    expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').length).toBe(0);

    hote.optionsAffichees = true;

    attendreLesOptionsOuvertes(hote);
    noeudsOmbre<HTMLButtonElement>(hote, 'option')[0].click();
    expect(noeudsOmbre<HTMLButtonElement>(hote, 'option')[0].disabled).toBeTrue();
  });

  it('sans delai, montre les options d emblee, sans champ, consigne ni compte a rebours', () => {
    hote.delaiMs = 0;
    const details = soumissionsDe(hote);

    expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').length).toBe(OPTIONS_AVEC_JE_NE_SAIS_PAS);
    expect(noeudOmbre(hote, 'rappel')).toBeNull();
    expect(noeudOmbre(hote, 'consigne')).toBeNull();
    expect(noeudOmbre(hote, 'compte-a-rebours')).toBeNull();

    noeudsOmbre<HTMLButtonElement>(hote, 'option')[0].click();
    expect(details.length).toBe(1);
    expect(details[0].rappel).toBe('');
  });

  it('sans delai, garde une consigne servie explicitement', () => {
    hote.delaiMs = 0;
    hote.consigne = 'Choisissez le pourcentage';
    expect(texteOmbre(hote, 'consigne')).toBe('Choisissez le pourcentage');
  });

  it('annonce le compte a rebours dans une region live', () => {
    const compte = noeudOmbre(hote, 'compte-a-rebours');
    expect(compte?.getAttribute('aria-live')).toBe('polite');
  });

  const PALIERS: ReadonlyArray<{ ecoule: number; annonce: string }> = [
    { ecoule: 0, annonce: 'Temps d’écriture libre : propositions de réponse dans 8 s' },
    { ecoule: 1000, annonce: 'Temps d’écriture libre : propositions de réponse dans 7 s' },
    { ecoule: 5000, annonce: 'Temps d’écriture libre : propositions de réponse dans 3 s' },
    { ecoule: 7000, annonce: 'Temps d’écriture libre : propositions de réponse dans 1 s' },
  ];

  for (const palier of PALIERS) {
    it(`annonce le temps restant apres ${palier.ecoule} ms`, () => {
      jasmine.clock().tick(palier.ecoule);
      expect(texteOmbre(hote, 'compte-a-rebours')).toBe(palier.annonce);
    });
  }

  it('ne remet pas le compte a rebours a zero quand la brique part puis revient', () => {
    jasmine.clock().tick(5000);
    hote.remove();
    document.body.appendChild(hote);
    expect(texteOmbre(hote, 'compte-a-rebours')).toBe(
      'Temps d’écriture libre : propositions de réponse dans 3 s',
    );
    jasmine.clock().tick(3000);
    expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').length).toBe(OPTIONS_AVEC_JE_NE_SAIS_PAS);
  });

  it('ne remplace pas le champ de rappel a chaque seconde ecoulee', () => {
    const champ = champRappel(hote);
    saisirRappel(hote, RAPPEL_ETUDIANT);
    jasmine.clock().tick(3000);
    expect(champRappel(hote)).toBe(champ);
    expect(champRappel(hote).value).toBe(RAPPEL_ETUDIANT);
  });

  it('emet le rappel libre saisi avec la reponse choisie', () => {
    const details = soumissionsDe(hote);
    saisirRappel(hote, RAPPEL_ETUDIANT);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    jasmine.clock().tick(400);
    choisirLOption(hote, 'b');
    expect(details.length).toBe(1);
    expect(details[0].rappel).toBe(RAPPEL_ETUDIANT);
    expect(details[0].valeur).toBe('b');
    expect(details[0].questionId).toBe(QUESTION.id);
    expect(details[0].dureeMs).toBe(DELAI_DEFAUT_MS + 400);
  });

  it('n emet qu une seule reponse par question', () => {
    const details = soumissionsDe(hote);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    noeudsOmbre<HTMLButtonElement>(hote, 'option')[0].click();
    noeudsOmbre<HTMLButtonElement>(hote, 'option')[1]?.click();
    expect(details.length).toBe(1);
    expect(noeudsOmbre<HTMLButtonElement>(hote, 'option').every((option) => option.disabled)).toBe(
      true,
    );
  });

  it('marque l option choisie, et elle seule, une fois la réponse envoyée', () => {
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    noeudsOmbre<HTMLButtonElement>(hote, 'option')[1].click();

    expect(
      noeudsOmbre<HTMLButtonElement>(hote, 'option').map((option) =>
        option.getAttribute('aria-pressed'),
      ),
    ).toEqual(noeudsOmbre<HTMLButtonElement>(hote, 'option').map((_, rang) => String(rang === 1)));
  });

  it('garde l ordre servi, deja melange par le serveur, et termine par je ne sais pas', () => {
    hote.setAttribute('seed', '4242');
    jasmine.clock().tick(DELAI_DEFAUT_MS);

    expect(ordreAffiche(hote)).toEqual([
      ...QUESTION.options.map((option) => option.id),
      '__je_ne_sais_pas__',
    ]);
  });

  it('ne garde que les champs publics des options, meme pour le poste presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.question = {
      ...buildRecallQuestion({ id: 'Q-RAPPEL-05' }),
      options: QUESTION.options.map((option) => ({ ...option, confusion: 'interet-simple' })),
    };
    expect(JSON.stringify(hote.question)).not.toContain('interet-simple');
  });

  it('affiche le verdict de sa question et clot les options', () => {
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    hote.verdict = buildVerdictDeReponse({ questionId: QUESTION.id, correcte: true });

    expect(texteOmbre(hote, 'verdict')).toContain('Juste');
    expect(
      noeudsOmbre<HTMLButtonElement>(hote, 'option').every((option) => option.disabled),
    ).toBeTrue();
  });

  it('memorise le rappel en brouillon et le restaure apres rechargement', () => {
    const brouillons = detailsEmis(hote, 'fp-brouillon');
    saisirRappel(hote, RAPPEL_ETUDIANT);

    expect(brouillons.at(-1)).toEqual({ id: QUESTION.id, valeur: { rappel: RAPPEL_ETUDIANT } });

    const rechargee = document.createElement('fp-recall') as FpRecall;
    rechargee.question = QUESTION;
    rechargee.brouillon = { rappel: RAPPEL_ETUDIANT };
    document.body.appendChild(rechargee);

    expect(champRappel(rechargee).value).toBe(RAPPEL_ETUDIANT);
    expect(texteOmbre(rechargee, 'brouillon-restaure')).toBe('Brouillon restauré');
    rechargee.remove();
  });

  it('ne reprend pas un brouillon dont le rappel n est pas un texte', () => {
    hote.brouillon = { rappel: 12 };

    expect(champRappel(hote).value).toBe('');
    expect(hote.shadowRoot?.textContent).not.toContain('Brouillon restauré');
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildRecallQuestion({ id: 'Q-RAPPEL-06' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.question = { ...piege, metadonnees };
    expect(JSON.stringify(hote.question)).not.toContain('bonneReponse');
  });

  it('echappe le html injecte dans l enonce et dans les libelles', () => {
    hote.question = buildRecallQuestion({
      id: 'Q-RAPPEL-07',
      enonce: CHARGE_XSS,
      options: [{ id: 'a', libelle: CHARGE_XSS }],
    });
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(CHARGE_XSS);
    expect(texteOmbre(hote, 'option')).toBe(CHARGE_XSS);
  });

  it('echappe le rappel libre reaffiche apres l apparition des options', () => {
    saisirRappel(hote, CHARGE_XSS);
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    attendreLeRenduEchappe(hote);
    expect(champRappel(hote).value).toBe(CHARGE_XSS);
  });

  it('garde concepts, modalite et duree dans les metadonnees sans les afficher en badge', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.question?.metadonnees.concepts).toEqual(['capitalisation']);
    expect(hote.question?.metadonnees.modalite).toBe('solo');
    expect(hote.question?.metadonnees.dureeMinutes).toBe(4);
    for (const repere of ['concepts', 'modalite', 'duree']) {
      expect(noeudOmbre(hote, repere)).withContext(repere).toBeNull();
    }
  });

  it('affiche la consigne par defaut, remplacee par une consigne servie non vide', () => {
    const parDefaut = texteOmbre(hote, 'consigne');
    expect(parDefaut).not.toBe('');

    hote.consigne = 'Redites la formule avant de voir les options';
    expect(texteOmbre(hote, 'consigne')).toBe('Redites la formule avant de voir les options');

    hote.consigne = '   ';
    expect(texteOmbre(hote, 'consigne')).toBe(parDefaut);
  });

  it('montre au presentateur l enonce, la consigne et le compte a rebours, sans champ ni suivi', () => {
    hote.setAttribute('data-cours-role', 'presentateur');

    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(QUESTION.enonce);
    expect(texteOmbre(hote, 'consigne')).not.toBe('');
    expect(texteOmbre(hote, 'compte-a-rebours')).toBe(
      'Temps d’écriture libre : propositions de réponse dans 8 s',
    );
    expect(noeudOmbre(hote, 'rappel')).toBeNull();
    expect(noeudOmbre(hote, 'retour')).toBeNull();
  });

  it('au terme du delai, montre au presentateur les options inertes sans je ne sais pas', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    const details = soumissionsDe(hote);
    jasmine.clock().tick(DELAI_DEFAUT_MS);

    expect(ordreAffiche(hote)).toEqual(QUESTION.options.map((option) => option.id));
    expect(
      noeudsOmbre<HTMLButtonElement>(hote, 'option').every((option) => option.disabled),
    ).toBeTrue();
    noeudsOmbre<HTMLButtonElement>(hote, 'option')[0].click();
    expect(details).toEqual([]);
  });

  for (const role of ROLES_DE_MONTAGE) {
    it(`Q1 · au role ${role}, l encadre porte la bonne reponse tant que les options sont masquees, puis la bonne option verte le remplace`, () => {
      hote.setAttribute('data-cours-role', role);
      hote.corrige = CORRIGE;

      expect(noeudOmbre(hote, 'options')).toBeNull();
      expect(texteOmbre(hote, 'bonne-reponse')).toContain(LIBELLE_PREMIERE);

      jasmine.clock().tick(DELAI_DEFAUT_MS);

      expect(attributDOption(hote, 'a', 'data-correction')).toBe('juste');
      expect(noeudOmbre(hote, 'bonne-reponse')).toBeNull();
    });
  }

  it('marque comme fausse l option choisie par l etudiant quand ce n est pas la bonne', () => {
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    choisirLOption(hote, 'b');

    hote.corrige = CORRIGE;

    attendreLaSeuleOptionFausse(hote, 'b', 'c');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    jasmine.clock().tick(DELAI_DEFAUT_MS);
    hote.corrige = CORRIGE;

    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(10);
    expect(classesOrphelines(hote, 'recall')).toEqual([]);
  });
});
