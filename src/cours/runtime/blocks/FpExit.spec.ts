import { buildExitBillet } from '../../../testing/factories/cours.factory';
import { feuilleDe } from '../design/blocks';
import { base, stage, tokens } from '../design/styles';
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
const RENDUS = ['hand', 'stage', 'board'];

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

function texteDe(element: FpExit, identifiant: string): string {
  return (
    element.shadowRoot?.querySelector(`[data-testid="${identifiant}"]`)?.textContent?.trim() ?? ''
  );
}

function detailsEmis(element: FpExit): DetailExit[] {
  const details: DetailExit[] = [];
  element.addEventListener('fp-exit-submit', (evenement) => {
    details.push((evenement as CustomEvent).detail as DetailExit);
  });
  return details;
}

describe('FpExit', () => {
  let hote: FpExit;

  beforeAll(() => {
    if (!customElements.get('fp-exit')) {
      customElements.define('fp-exit', FpExit);
    }
  });

  beforeEach(() => {
    hote = document.createElement('fp-exit') as FpExit;
    hote.billet = BILLET;
    document.body.appendChild(hote);
  });

  afterEach(() => {
    hote.remove();
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
    const details = detailsEmis(hote);
    ecrire(hote, TEXTE_COURT);
    envoyer(hote);
    expect(details).toEqual([]);
    expect(texteDe(hote, 'retour')).toBe('Choisissez une réponse avant d’envoyer');
  });

  it('accepte un billet sans texte libre', () => {
    const details = detailsEmis(hote);
    choisir(hote, 'a');
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(details[0].texteLibre).toBe('');
    expect(details[0].valeur).toBe('a');
    expect(details[0].billetId).toBe(BILLET.id);
  });

  it('emet la reponse fermee et le texte libre ensemble', () => {
    const details = detailsEmis(hote);
    choisir(hote, 'b');
    ecrire(hote, TEXTE_COURT);
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(details[0].valeur).toBe('b');
    expect(details[0].texteLibre).toBe(TEXTE_COURT);
  });

  it('accepte un texte libre de cinq cents caracteres', () => {
    const details = detailsEmis(hote);
    choisir(hote, 'a');
    ecrire(hote, 'a'.repeat(LIMITE));
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(details[0].texteLibre.length).toBe(LIMITE);
  });

  it('refuse un texte libre plus long que la limite en disant la limite', () => {
    const details = detailsEmis(hote);
    choisir(hote, 'a');
    ecrire(hote, 'a'.repeat(LIMITE + 1));
    envoyer(hote);
    expect(details).toEqual([]);
    const retour = texteDe(hote, 'retour');
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
    const rendu = hote.shadowRoot?.innerHTML ?? '';
    expect(rendu).not.toContain('<img src=x');
    expect(rendu).toContain('&lt;img');
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(texteDe(hote, 'recap-texte')).toBe(CHARGE_XSS);
    expect(champLibre(hote).value).toBe(CHARGE_XSS);
  });

  it('echappe le html injecte dans un libelle d option', () => {
    hote.billet = buildExitBillet({
      id: 'B-SORTIE-10',
      options: [{ id: 'a', libelle: CHARGE_XSS, misconception: null }],
    });
    expect(hote.shadowRoot?.querySelector('img')).toBeNull();
    expect(texteDe(hote, 'option')).toBe(CHARGE_XSS);
  });

  it('marque l option retenue pour les technologies d assistance', () => {
    choisir(hote, 'c');
    const retenue = hote.shadowRoot?.querySelector('[data-option="c"]');
    expect(retenue?.getAttribute('aria-pressed')).toBe('true');
    expect(hote.shadowRoot?.querySelector('[data-option="a"]')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('n emet qu un seul billet et verrouille la saisie', () => {
    const details = detailsEmis(hote);
    choisir(hote, 'a');
    envoyer(hote);
    envoyer(hote);
    expect(details.length).toBe(1);
    expect(champLibre(hote).disabled).toBe(true);
    expect(texteDe(hote, 'retour')).toBe('Réponse enregistrée');
  });

  it('annonce le retour dans une region live', () => {
    expect(hote.shadowRoot?.querySelector('[aria-live="polite"]')).toBeTruthy();
    expect(hote.shadowRoot?.querySelector('fieldset')).toBeTruthy();
  });

  it('affiche la longueur saisie face a la limite', () => {
    ecrire(hote, TEXTE_COURT);
    choisir(hote, 'a');
    expect(texteDe(hote, 'jauge')).toBe(`${TEXTE_COURT.length} / ${LIMITE}`);
  });

  it('efface la misconception pour le poste etudiant', () => {
    expect(hote.billet?.options.every((option) => !('misconception' in option))).toBe(true);
    expect(JSON.stringify(hote.billet?.options)).not.toContain('proportionnalite');
  });

  it('conserve la misconception pour le poste presentateur', () => {
    hote.setAttribute('role', 'presentateur');
    hote.billet = buildExitBillet({ id: 'B-SORTIE-11' });
    expect(hote.billet?.options[1]).toEqual(
      jasmine.objectContaining({ misconception: 'proportionnalite' }),
    );
  });

  it('efface une donnee de correction nichee dans les metadonnees', () => {
    const piege = buildExitBillet({ id: 'B-SORTIE-12' });
    const metadonnees = { ...piege.metadonnees, bonneReponse: 'a' };
    hote.billet = { ...piege, metadonnees };
    expect(JSON.stringify(hote.billet)).not.toContain('bonneReponse');
  });

  it('rappelle le regime et la duree en mode tableau', () => {
    hote.setAttribute('render', 'board');
    expect(texteDe(hote, 'regime')).toBe('ouvert');
    expect(texteDe(hote, 'duree')).toBe('5 min');
  });

  it('couvre par une regle de la feuille chaque classe fp emise', () => {
    const feuille = [tokens, base, feuilleDe('exit'), stage].join('\n');
    choisir(hote, 'a');
    envoyer(hote);
    const emises = new Set<string>();
    for (const rendu of RENDUS) {
      hote.setAttribute('render', rendu);
      for (const noeud of hote.shadowRoot?.querySelectorAll('[class]') ?? []) {
        noeud.classList.forEach((classe) => emises.add(classe));
      }
    }
    expect(emises.size).toBeGreaterThanOrEqual(10);
    const orphelines = [...emises].filter(
      (classe) => !new RegExp(`\\.${classe}(?![\\w-])`).test(feuille),
    );
    expect(orphelines).toEqual([]);
  });
});
