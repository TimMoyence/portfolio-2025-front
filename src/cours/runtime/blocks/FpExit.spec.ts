import { attendreLeRenduEchappe, attendreUneRegionLive } from '../../../testing/assertions-briques';
import {
  attributDOption,
  detailsEmis,
  installerBrique,
  texteOmbre,
} from '../../../testing/banc-de-brique';
import { classesEmises, classesOrphelines } from '../../../testing/classes-briques';
import { buildExitBillet, buildVerdictDeReponse } from '../../../testing/factories/cours.factory';
import { FpExit } from './FpExit';

interface DetailExit {
  billetId: string;
  valeur: string;
  texteLibre: string;
  dureeMs: number;
}

const BILLET = buildExitBillet();
const LIMITE = 500;
const TEXTE_COURT = 'Le passage du taux annuel au taux mensuel reste flou';
const CHARGE_XSS = '<img src=x onerror="alert(1)">';

function champLibre(element: FpExit): HTMLTextAreaElement {
  const champ = element.shadowRoot?.querySelector<HTMLTextAreaElement>(
    '[data-testid="texte-libre"]',
  );
  if (champ === null || champ === undefined) {
    throw new Error('champ de texte libre absent');
  }
  return champ;
}

function ecrire(element: FpExit, frappe: string): void {
  const champ = champLibre(element);
  champ.value = frappe;
  champ.dispatchEvent(new Event('input'));
}

function choisir(element: FpExit, option: string): void {
  element.shadowRoot?.querySelector<HTMLButtonElement>(`[data-option="${option}"]`)?.click();
}

function envoyer(element: FpExit): void {
  element.shadowRoot?.querySelector<HTMLButtonElement>('[data-testid="envoyer"]')?.click();
}

function soumissionsDe(element: FpExit): DetailExit[] {
  return detailsEmis(element, 'fp-exit-submit');
}

describe('FpExit', () => {
  let hote: FpExit;

  installerBrique<FpExit>({
    balise: 'fp-exit',
    classe: FpExit,
    poser: (brique) => {
      hote = brique;
      brique.billet = BILLET;
    },
  });

  it('presente le quiz conceptuel et la question ouverte', () => {
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(BILLET.question);
    expect(hote.shadowRoot?.querySelectorAll('[data-testid="option"]').length).toBe(
      BILLET.options.length,
    );
    expect(hote.shadowRoot?.querySelector('label')?.textContent?.trim()).toBe(BILLET.invite);
    expect(champLibre(hote).value).toBe('');
  });

  it('rattache le champ libre a son invite', () => {
    const etiquette = hote.shadowRoot?.querySelector('label');
    expect(champLibre(hote).id).toBe(etiquette?.getAttribute('for') ?? '');
  });

  it('refuse d envoyer sans reponse a la question fermee', () => {
    const details = soumissionsDe(hote);
    ecrire(hote, TEXTE_COURT);
    envoyer(hote);
    expect(details).toEqual([]);
    expect(texteOmbre(hote, 'retour')).toBe('Choisissez une réponse avant d’envoyer');
  });

  it('accepte un billet sans texte libre', () => {
    const details = soumissionsDe(hote);
    choisir(hote, 'a');
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(details[0].texteLibre).toBe('');
    expect(details[0].valeur).toBe('a');
    expect(details[0].billetId).toBe(BILLET.id);
  });

  it('emet la reponse fermee et le texte libre ensemble', () => {
    const details = soumissionsDe(hote);
    choisir(hote, 'b');
    ecrire(hote, TEXTE_COURT);
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(details[0].valeur).toBe('b');
    expect(details[0].texteLibre).toBe(TEXTE_COURT);
  });

  it('accepte un texte libre de cinq cents caracteres', () => {
    const details = soumissionsDe(hote);
    choisir(hote, 'a');
    ecrire(hote, 'a'.repeat(LIMITE));
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(details[0].texteLibre.length).toBe(LIMITE);
  });

  it('refuse un texte libre plus long que la limite en disant la limite', () => {
    const details = soumissionsDe(hote);
    choisir(hote, 'a');
    ecrire(hote, 'a'.repeat(LIMITE + 1));
    envoyer(hote);
    expect(details).toEqual([]);
    const retour = texteOmbre(hote, 'retour');
    expect(retour).toContain(String(LIMITE));
    expect(retour).toBe('Réduisez votre réponse à 500 caractères maximum');
  });

  it('conserve le texte refuse pour que l etudiant puisse l elaguer', () => {
    choisir(hote, 'a');
    ecrire(hote, 'a'.repeat(LIMITE + 1));
    envoyer(hote);
    expect(champLibre(hote).value.length).toBe(LIMITE + 1);
    expect(champLibre(hote).disabled).toBe(false);
  });

  it('echappe le texte libre a l affichage', () => {
    choisir(hote, 'a');
    ecrire(hote, CHARGE_XSS);
    envoyer(hote);
    attendreLeRenduEchappe(hote);
    expect(texteOmbre(hote, 'recap-texte')).toBe(CHARGE_XSS);
    expect(champLibre(hote).value).toBe(CHARGE_XSS);
  });

  it('echappe le html injecte dans un libelle d option', () => {
    hote.billet = buildExitBillet({
      id: 'B-SORTIE-10',
      options: [{ id: 'a', libelle: CHARGE_XSS }],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(texteOmbre(hote, 'option')).toBe(CHARGE_XSS);
  });

  it('marque l option retenue pour les technologies d assistance', () => {
    choisir(hote, 'c');
    expect(attributDOption(hote, 'c', 'aria-pressed')).toBe('true');
    expect(attributDOption(hote, 'a', 'aria-pressed')).toBe('false');
  });

  it('n emet qu un seul billet et verrouille la saisie', () => {
    const details = soumissionsDe(hote);
    choisir(hote, 'a');
    envoyer(hote);
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(champLibre(hote).disabled).toBe(true);
    expect(texteOmbre(hote, 'retour')).toBe('Réponse enregistrée');
  });

  it('annonce le retour dans une region live', () => {
    attendreUneRegionLive(hote);
  });

  it('affiche la longueur saisie face a la limite', () => {
    ecrire(hote, TEXTE_COURT);
    choisir(hote, 'a');
    expect(texteOmbre(hote, 'jauge')).toBe(`${TEXTE_COURT.length} / ${LIMITE}`);
  });

  it('ne garde que les champs publics des options, meme pour le poste presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    hote.billet = {
      ...buildExitBillet({ id: 'B-SORTIE-11' }),
      options: BILLET.options.map((option) => ({ ...option, confusion: 'proportionnalite' })),
    };
    expect(JSON.stringify(hote.billet)).not.toContain('proportionnalite');
  });

  it('affiche le verdict du choix et garde le recapitulatif apres reinjection', () => {
    choisir(hote, 'b');
    ecrire(hote, TEXTE_COURT);
    envoyer(hote);
    hote.verdict = buildVerdictDeReponse({
      questionId: BILLET.id,
      libelleConfusion: 'Proportionnalité',
    });

    expect(texteOmbre(hote, 'verdict')).toContain('Proportionnalité');
    expect(texteOmbre(hote, 'recap-texte')).toBe(TEXTE_COURT);
  });

  it('memorise le choix et le texte en brouillon, puis les restaure', () => {
    const brouillons = detailsEmis(hote, 'fp-brouillon');
    choisir(hote, 'c');
    ecrire(hote, TEXTE_COURT);

    expect(brouillons.at(-1)).toEqual({
      id: BILLET.id,
      valeur: { texteLibre: TEXTE_COURT, choix: 'c' },
    });

    const rechargee = document.createElement('fp-exit') as FpExit;
    rechargee.billet = BILLET;
    rechargee.brouillon = { texteLibre: TEXTE_COURT, choix: 'c' };
    document.body.appendChild(rechargee);

    expect(champLibre(rechargee).value).toBe(TEXTE_COURT);
    expect(
      rechargee.shadowRoot?.querySelector('[data-option="c"]')?.getAttribute('aria-pressed'),
    ).toBe('true');
    rechargee.remove();
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildExitBillet({ id: 'B-SORTIE-12' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.billet = { ...piege, metadonnees };
    expect(JSON.stringify(hote.billet)).not.toContain('bonneReponse');
  });

  it('garde le regime et la duree dans les metadonnees sans les afficher en badge', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.billet?.metadonnees.regime).toBe('ouvert');
    expect(hote.billet?.metadonnees.dureeMinutes).toBe(5);
    expect(hote.shadowRoot?.querySelector('[data-testid="regime"]')).toBeNull();
    expect(hote.shadowRoot?.querySelector('[data-testid="duree"]')).toBeNull();
  });

  it('montre au presentateur la meme question et les memes options, inertes, avec l invite sans champ', () => {
    const carte = hote.shadowRoot?.querySelector('fieldset')?.getAttribute('class');
    hote.setAttribute('data-cours-role', 'presentateur');
    const options = [
      ...(hote.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-testid="option"]') ?? []),
    ];

    expect(hote.shadowRoot?.querySelector('fieldset')?.getAttribute('class')).toBe(carte);
    expect(hote.shadowRoot?.querySelector('legend')?.textContent?.trim()).toBe(BILLET.question);
    expect(options.length).toBe(BILLET.options.length);
    expect(options.every((option) => option.disabled)).toBeTrue();
    expect(texteOmbre(hote, 'invite')).toBe(BILLET.invite);
    expect(hote.shadowRoot?.querySelector('textarea')).toBeNull();
    expect(hote.shadowRoot?.querySelector('[data-testid="envoyer"]')).toBeNull();
    expect(hote.shadowRoot?.querySelector('[data-testid="jauge"]')).toBeNull();
  });

  it('n emet rien ni ne memorise de brouillon depuis le poste presentateur', () => {
    hote.setAttribute('data-cours-role', 'presentateur');
    const details = soumissionsDe(hote);
    const brouillons: unknown[] = [];
    hote.addEventListener('fp-brouillon', (evenement) => brouillons.push(evenement));

    choisir(hote, 'a');

    expect(details).toEqual([]);
    expect(brouillons).toEqual([]);
    expect(attributDOption(hote, 'a', 'aria-pressed')).toBe('false');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    choisir(hote, 'a');
    envoyer(hote);

    expect(classesEmises(hote).size).toBeGreaterThanOrEqual(10);
    expect(classesOrphelines(hote, 'exit')).toEqual([]);
  });
});
