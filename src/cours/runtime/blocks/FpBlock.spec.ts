import {
  enregistrerBrique,
  noeudOmbre,
  noeudsOmbre,
  racineOmbre,
  roleAffiche,
} from '../../../testing/banc-de-brique';
import { deuxImages } from '../../../testing/deux-images';
import { figerLesHorloges, reculerLaPendule, UNE_HEURE_MS } from '../../../testing/horloge-simulee';
import { compterLesAbonnesAuxPolices } from '../../../testing/polices';
import { type EscapedHtml, safeHtml } from '../core/html';
import { FpBlock } from './FpBlock';

class FpDemo extends FpBlock {
  render(): EscapedHtml {
    return safeHtml`<p data-testid="scene">scene</p><button data-testid="action">agir</button><input data-testid="champ" data-cle="a" value="saisie">${this.annonces()}`;
  }
  question: string | null = 'Q-1';

  bind(racine: ShadowRoot): void {
    this.suivreAffichage(this.question);
    racine
      .querySelector('[data-testid="action"]')
      ?.addEventListener('click', () => this.emit('fp-action', { ok: true }));
  }

  imprimer(libelles: readonly string[]): string {
    return this.casesAImprimer(libelles.map((libelle) => ({ libelle }))).join('');
  }

  changerDeQuestion(id: string): void {
    this.question = id;
    this.suivreEtRafraichir(id);
  }
}

class FpBroken extends FpBlock {
  render(): EscapedHtml {
    throw new Error('rendu impossible');
  }

  bind(): void {
    return undefined;
  }
}

class FpSaisie extends FpBlock {
  render(): EscapedHtml {
    return safeHtml`<textarea data-cle="a"></textarea><div data-zone="z"><textarea data-cle="b"></textarea></div>`;
  }

  bind(): void {
    return undefined;
  }

  reecrireLaZone(): void {
    this.rafraichirZone('z', safeHtml`<textarea data-cle="b"></textarea>`);
  }
}

describe('FpBlock', () => {
  let hote: FpDemo;
  let enveloppe: HTMLDivElement | null;
  let horlogeSimulee: jasmine.Clock | null = null;

  beforeAll(() => {
    enregistrerBrique('fp-demo', FpDemo);
    enregistrerBrique('fp-broken', FpBroken);
    enregistrerBrique('fp-saisie', FpSaisie);
  });

  beforeEach(() => {
    hote = document.createElement('fp-demo') as FpDemo;
    document.body.appendChild(hote);
    enveloppe = null;
  });

  afterEach(() => {
    horlogeSimulee?.uninstall();
    horlogeSimulee = null;
    hote.remove();
    enveloppe?.remove();
  });

  function figerLHorloge(): void {
    figerLesHorloges(0);
    horlogeSimulee = jasmine.clock();
  }

  function poserLaQuestionChronometree(): void {
    figerLHorloge();
    hote.question = 'Q-CHRONO';
    hote.refresh();
    jasmine.clock().tick(8000);
  }

  function attendreLActionSurLeDocument(done: DoneFn): void {
    document.addEventListener(
      'fp-action',
      (event) => {
        expect((event as CustomEvent).detail).toEqual({ ok: true });
        done();
      },
      { once: true },
    );
  }

  it('rend son unique rendu pour le role etudiant par defaut', () => {
    expect(noeudOmbre(hote, 'scene')).toBeTruthy();
    expect(noeudOmbre(hote, 'action')).toBeTruthy();
  });

  it('rend le meme contenu au presentateur qu a l etudiant', () => {
    const etudiant = racineOmbre(hote)?.innerHTML;
    expect(etudiant).toContain('data-testid="scene"');
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(racineOmbre(hote)?.innerHTML).toBe(etudiant);
  });

  it('se rafraichit quand l hote change le role', () => {
    const avant = racineOmbre(hote);
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(racineOmbre(hote)).not.toBe(avant);
  });

  it('adopte les styles du design system', () => {
    expect(hote.shadowRoot?.adoptedStyleSheets.length).toBeGreaterThan(0);
  });

  it('pose la classe racine sur son conteneur', () => {
    expect(racineOmbre(hote)).toBeTruthy();
  });

  it('expose le role sur le conteneur', () => {
    expect(roleAffiche(hote)).toBe('etudiant');
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(roleAffiche(hote)).toBe('presentateur');
  });

  it('emet un evenement composed qui traverse le shadow DOM', (done) => {
    attendreLActionSurLeDocument(done);
    noeudOmbre<HTMLButtonElement>(hote, 'action')?.click();
  });

  it('emet un evenement composed qui traverse une racine shadow englobante', (done) => {
    enveloppe = document.createElement('div');
    const racineEnveloppe = enveloppe.attachShadow({ mode: 'open' });
    const hoteImbrique = document.createElement('fp-demo') as FpDemo;
    racineEnveloppe.appendChild(hoteImbrique);
    document.body.appendChild(enveloppe);

    attendreLActionSurLeDocument(done);

    noeudOmbre<HTMLButtonElement>(hoteImbrique, 'action')?.click();
  });

  it('lit le role reel pose par l hote sur data-cours-role', () => {
    expect(hote.roleActuel()).toBe('etudiant');
    hote.setAttribute('data-cours-role', 'presentateur');
    expect(hote.roleActuel()).toBe('presentateur');
    hote.setAttribute('data-slide-role', 'revision');
    expect(hote.roleActuel()).toBe('presentateur');
  });

  it('se sait en apercu quand l hote pose data-apercu', () => {
    expect(hote.enApercu()).toBeFalse();
    hote.setAttribute('data-apercu', '');
    expect(hote.enApercu()).toBeTrue();
  });

  it('affiche le refus et le deja repondu que l hote reinjecte, puis les retire', () => {
    hote.erreur = 'Cet écran n’est pas encore ouvert';
    hote.dejaRepondu = true;

    expect(noeudOmbre(hote, 'erreur')?.getAttribute('role')).toBe('alert');
    expect(noeudOmbre(hote, 'erreur')?.textContent).toContain('pas encore');
    expect(noeudOmbre(hote, 'deja-repondu')?.textContent).toBe(
      'Réponse déjà enregistrée : voici votre verdict',
    );

    hote.erreur = null;
    hote.dejaRepondu = false;

    expect(noeudOmbre(hote, 'erreur')).toBeNull();
    expect(noeudOmbre(hote, 'deja-repondu')).toBeNull();
  });

  it('S-02 · affiche sous la brique les explications de correction révélées, et rien sans elles', () => {
    expect(noeudOmbre(hote, 'explications')).toBeNull();

    hote.explications = [
      { reference: 'e1', texte: '140 400 ÷ 600 000 = 23,4 %.' },
      { reference: 'e2', texte: '23,4 − 26,2 = −2,8 points.' },
    ];

    expect(
      noeudsOmbre(hote, 'explication').map((explication) => [
        explication.getAttribute('data-cle'),
        explication.textContent,
      ]),
    ).toEqual([
      ['e1', '140 400 ÷ 600 000 = 23,4 %.'],
      ['e2', '23,4 − 26,2 = −2,8 points.'],
    ]);
    expect(noeudOmbre(hote, 'explications')?.textContent).toContain('Correction');

    hote.explications = [];
    expect(noeudOmbre(hote, 'explications')).toBeNull();
  });

  it('R-02 · passe a la ligne une formule insecable des explications plutot que de deborder de l encadre', () => {
    hote.style.cssText = 'display:block;width:260px;';
    hote.explications = [
      {
        reference: 'e1',
        texte: 'Délai en jours ouvrés : =NB.JOURS.OUVRES(date_commande;date_livraison), recopiée.',
      },
    ];

    const encadre = noeudOmbre<HTMLElement>(hote, 'explications');
    expect(encadre?.scrollWidth).toBeLessThanOrEqual(encadre?.clientWidth ?? 0);
  });

  it('R-03 · range plusieurs explications sur deux colonnes d une toile large, dans l ordre de lecture, une seule pleine largeur', () => {
    const lignes = (): DOMRect[] =>
      noeudsOmbre(hote, 'explication').map((ligne) => ligne.getBoundingClientRect());
    hote.style.cssText = 'display:block;width:1216px;';
    hote.explications = [{ reference: 'e1', texte: 'Ville mal écrite : on corrige par formule.' }];
    const [seule] = lignes();

    hote.explications = [
      { reference: 'e1', texte: 'Ville mal écrite : on corrige par formule.' },
      { reference: 'e2', texte: 'Produit inconnu : on signale et on demande.' },
      { reference: 'e3', texte: 'Case vide : une donnée douteuse ne se corrige jamais seule.' },
    ];
    const [premiere, seconde, troisieme] = lignes();

    expect(seconde.left).toBeGreaterThanOrEqual(premiere.right);
    expect(seconde.top).toBeCloseTo(premiere.top, 0);
    expect(troisieme.top).toBeGreaterThanOrEqual(premiere.bottom);
    expect(seule.width).toBeGreaterThan(premiere.width * 1.5);

    hote.style.cssText = 'display:block;width:360px;';
    const [etroite, suivante] = lignes();
    expect(suivante.top).toBeGreaterThanOrEqual(etroite.bottom);
  });

  it('rend le foyer et la selection au champ saisi quand un rafraichissement le remplace', () => {
    const champ = noeudOmbre<HTMLInputElement>(hote, 'champ');
    champ?.focus();
    champ?.setSelectionRange(2, 4);

    hote.dejaRepondu = true;

    const remplacant = noeudOmbre<HTMLInputElement>(hote, 'champ');
    expect(remplacant).not.toBe(champ);
    expect(hote.shadowRoot?.activeElement).toBe(remplacant ?? null);
    expect([remplacant?.selectionStart, remplacant?.selectionEnd]).toEqual([2, 4]);
  });

  it('QP-09 · n abonne aux polices que les zones de saisie presentes d une brique masquee rafraichie, et plus aucune une fois retiree', async () => {
    const abonnes = compterLesAbonnesAuxPolices();
    enveloppe = document.createElement('div');
    enveloppe.hidden = true;
    document.body.appendChild(enveloppe);
    const saisie = document.createElement('fp-saisie') as FpSaisie;
    enveloppe.appendChild(saisie);
    await deuxImages();
    saisie.refresh();
    await deuxImages();
    saisie.reecrireLaZone();
    await deuxImages();
    const presente = abonnes();

    enveloppe.remove();
    await deuxImages();

    expect({ presente, retiree: abonnes() }).toEqual({ presente: 2, retiree: 0 });
  });

  it('signale une erreur de rendu par un evenement compose', (done) => {
    const broken = document.createElement('fp-broken');
    broken.addEventListener(
      'fp-block-error',
      (event) => {
        expect((event as CustomEvent).detail).toEqual(new Error('rendu impossible'));
        broken.remove();
        done();
      },
      { once: true },
    );
    document.body.appendChild(broken);
  });

  it('traduit une cle d interface connue', () => {
    expect(hote.texte('valider')).toBe('Valider');
  });

  it('retourne la cle pour un libelle inconnu', () => {
    expect(hote.texte('cle-absente')).toBe('cle-absente');
  });

  it('ne rearme pas le chronometre quand la meme question est rendue a nouveau', () => {
    poserLaQuestionChronometree();
    hote.refresh();
    hote.refresh();

    expect(hote.depuisAffichage()).toBe(8000);
  });

  it('rearme le chronometre quand la question change', () => {
    poserLaQuestionChronometree();
    hote.question = 'Q-SUIVANTE';
    hote.refresh();
    jasmine.clock().tick(300);

    expect(hote.depuisAffichage()).toBe(300);
  });

  it('rafraichit le rendu d une brique connectee quand la question suivie change', () => {
    poserLaQuestionChronometree();
    const rendu = spyOn(hote, 'render').and.callThrough();

    hote.changerDeQuestion('Q-SUIVANTE');

    expect(rendu).toHaveBeenCalledTimes(1);
  });

  it('rearme le chronometre de la question suivie sans rendre une brique detachee', () => {
    poserLaQuestionChronometree();
    hote.remove();
    const rendu = spyOn(hote, 'render').and.callThrough();

    hote.changerDeQuestion('Q-SUIVANTE');
    jasmine.clock().tick(300);

    expect(hote.depuisAffichage()).toBe(300);
    expect(rendu).not.toHaveBeenCalled();
  });

  it('imprime une case par option, son libelle echappe', () => {
    expect(hote.imprimer(['<b>A</b>', 'B'])).toBe(
      '<li data-testid="case">&lt;b&gt;A&lt;/b&gt;</li><li data-testid="case">B</li>',
    );
  });

  it('compte zero et non une duree negative quand la mesure passe sous l instant d affichage', () => {
    poserLaQuestionChronometree();
    jasmine.clock().mockDate(new Date(-60_000));

    expect(hote.depuisAffichage()).toBe(0);
  });

  it('rend le temps restant d une duree depuis l affichage, sans descendre sous zero', () => {
    poserLaQuestionChronometree();

    expect(hote.restantDepuisAffichage(10_000)).toBe(2000);
    expect(hote.restantDepuisAffichage(8000)).toBe(0);
    expect(hote.restantDepuisAffichage(5000)).toBe(0);
  });

  it('garde le temps d affichage juste quand l horloge du poste recule d une heure', () => {
    poserLaQuestionChronometree();
    reculerLaPendule(UNE_HEURE_MS);
    jasmine.clock().tick(300);

    expect(hote.depuisAffichage()).toBe(8300);
  });
});
