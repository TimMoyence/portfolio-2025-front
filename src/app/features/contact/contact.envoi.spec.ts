import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CONTACT_PORT, type ContactPort } from '../../core/ports/contact.port';
import { annonces } from '../../../testing/dom/annonces';
import { CONTACT_PORT_PAR_DEFAUT } from '../../../testing/factories/contact.factory';
import { pageMontee } from '../../../testing/page/montage-page';
import { ContactComponent } from './contact.component';

const OBLIGATOIRE = 'Ce champ est obligatoire.';

describe('REC-13 · Envoyer montre ce qui manque au lieu de rester grisé', () => {
  const page = pageMontee(ContactComponent, {
    providers: [CONTACT_PORT_PAR_DEFAUT],
  });

  const port = () => TestBed.inject(CONTACT_PORT) as jasmine.SpyObj<ContactPort>;

  const champ = <T extends HTMLElement>(selecteur: string): T => {
    const trouve = page.racine.querySelector<T>(selecteur);
    if (trouve === null) {
      throw new Error(`aucun ${selecteur}`);
    }
    return trouve;
  };

  const stabiliser = async (): Promise<void> => {
    page.fixture.detectChanges();
    await page.fixture.whenStable();
    page.fixture.detectChanges();
  };

  const saisir = async (selecteur: string, valeur: string): Promise<void> => {
    const element = champ<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selecteur);
    element.value = valeur;
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input'));
    await stabiliser();
  };

  const cocher = async (selecteur: string): Promise<void> => {
    champ<HTMLInputElement>(selecteur).click();
    await stabiliser();
  };

  const remplirSauf = async (...absents: readonly string[]): Promise<void> => {
    const saisies: readonly (readonly [string, () => Promise<void>])[] = [
      ['besoin', () => saisir('#besoin', 'creer')],
      ['role', () => cocher('input[name="role"]')],
      ['firstName', () => saisir('#firstName', 'Léa')],
      ['lastName', () => saisir('#lastName', 'Martin')],
      ['email', () => saisir('#email', 'lea@exemple.fr')],
      ['message', () => saisir('#message', 'Un site pour ma boulangerie.')],
      ['terms', () => cocher('input[name="terms"]')],
    ];
    for (const [nom, remplir] of saisies) {
      if (!absents.includes(nom)) {
        await remplir();
      }
    }
  };

  const envoyer = async (): Promise<void> => {
    champ<HTMLButtonElement>('button[type="submit"]').click();
    await stabiliser();
  };

  const alertes = (): string[] =>
    Array.from(page.racine.querySelectorAll('form [role="alert"][id$="-erreur"]')).map(texte);

  const champsEnErreur = (): string[] =>
    Array.from(page.racine.querySelectorAll<HTMLElement>('form [aria-invalid="true"]')).map(
      (element) => element.getAttribute('name') ?? element.id,
    );

  it('REC-13 · Envoyer est actif sur un formulaire vide', () => {
    expect(champ<HTMLButtonElement>('button[type="submit"]').disabled).toBeFalse();
  });

  it('REC-13 · un clic sur un formulaire vide annonce sept champs obligatoires et n envoie rien', async () => {
    await envoyer();

    expect(alertes()).toEqual(Array(7).fill(OBLIGATOIRE));
    expect(annonces(page.racine, 'alert').filter((annonce) => annonce !== OBLIGATOIRE)).toEqual([
      'Merci de vérifier les champs en rouge.',
    ]);
    expect([...new Set(champsEnErreur())]).toEqual([
      'besoin',
      'role',
      'firstName',
      'lastName',
      'email',
      'message',
      'terms',
    ]);
    expect(port().contact).not.toHaveBeenCalled();
  });

  it('REC-13 · le focus va sur le premier champ en erreur : Votre besoin', async () => {
    await envoyer();

    expect(document.activeElement).toBe(champ('#besoin'));
  });

  it('REC-13 · pour l activité, le focus va sur sa première option', async () => {
    await remplirSauf('role');
    await envoyer();

    expect(document.activeElement).toBe(champ('input[name="role"]'));
  });

  it('REC-13 · chaque champ en erreur est lié à son message par aria-describedby', async () => {
    await envoyer();
    const enErreur = Array.from(page.racine.querySelectorAll('form [aria-invalid="true"]'));

    expect(enErreur.length).toBeGreaterThan(0);
    for (const element of enErreur) {
      const message = page.racine.querySelector(`#${element.getAttribute('aria-describedby')}`);
      expect(message?.getAttribute('role'))
        .withContext(element.getAttribute('name') ?? element.id)
        .toBe('alert');
    }
  });

  it('REC-13 · une adresse invalide et des conditions décochées : deux messages, focus sur Email', async () => {
    await remplirSauf('terms');
    await saisir('#email', 'tim@');
    await envoyer();

    expect(alertes()).toEqual(['Merci d’entrer une adresse email valide.', OBLIGATOIRE]);
    expect(document.activeElement).toBe(champ('#email'));
    expect(port().contact).not.toHaveBeenCalled();
  });

  it('REC-13 · un projet de neuf caractères dit le minimum', async () => {
    await remplirSauf();
    await saisir('#message', 'a'.repeat(9));
    await envoyer();

    expect(alertes()).toEqual(['Ce champ doit contenir au moins 10 caractères.']);
  });

  it('REC-13 · un téléphone « 12 » dit qu il est invalide', async () => {
    await remplirSauf();
    await saisir('#phone', '12');
    await envoyer();

    expect(alertes()).toEqual(['Merci d’entrer un numéro de téléphone valide.']);
  });

  it('REC-13 · un téléphone vide n empêche pas l envoi, qui part sans téléphone', async () => {
    await remplirSauf();
    await envoyer();

    expect(port().contact).toHaveBeenCalledTimes(1);
    expect(port().contact.calls.mostRecent().args[0].phone).toBeNull();
  });

  it('REC-13 · pendant l envoi, Envoyer est occupé et un double clic n envoie qu une fois', async () => {
    port().contact.and.returnValue(new Subject());
    await remplirSauf();
    const bouton = champ<HTMLButtonElement>('button[type="submit"]');

    bouton.click();
    bouton.click();
    await stabiliser();

    expect(port().contact).toHaveBeenCalledTimes(1);
    expect(bouton.disabled).toBeTrue();
    expect(bouton.getAttribute('aria-busy')).toBe('true');
  });

  it('REC-13 · après un envoi réussi, un second clic garde la confirmation et n annonce aucune erreur', async () => {
    await remplirSauf();
    await envoyer();
    await envoyer();

    expect(annonces(page.racine, 'alert')).toEqual([]);
    expect(texte(page.racine.querySelector('[role="status"]'))).toBe(
      'Message envoyé. Je reviens vers vous rapidement.',
    );
    expect(port().contact).toHaveBeenCalledTimes(1);
  });

  it('REC-13 · après un envoi réussi, retaper un champ rend au clic son comportement habituel', async () => {
    await remplirSauf();
    await envoyer();
    await saisir('#firstName', 'Léa');
    await envoyer();

    expect(alertes()).toEqual(Array(6).fill(OBLIGATOIRE));
    expect(page.racine.querySelector('[role="status"]')).toBeNull();
    expect(port().contact).toHaveBeenCalledTimes(1);
  });

  it('REC-13 · les champs d identité se remplissent par autocomplete', () => {
    expect(
      ['#firstName', '#lastName', '#email', '#phone'].map((selecteur) =>
        champ(selecteur).getAttribute('autocomplete'),
      ),
    ).toEqual(['given-name', 'family-name', 'email', 'tel']);
  });
});
