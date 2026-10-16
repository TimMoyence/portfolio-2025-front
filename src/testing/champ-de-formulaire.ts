import type { ComponentFixture } from '@angular/core/testing';
import type { ValidationErrors } from '@angular/forms';
import { NgModel } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { LONGUEUR_MIN_D_UN_MOT_DE_PASSE } from '../app/shared/utils/regles-de-saisie';

export const REGLE_ATTENDUE_DU_MOT_DE_PASSE = `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_D_UN_MOT_DE_PASSE} caractères, dont une majuscule, un chiffre et un caractère spécial.`;

export const REGLE_SERVIE_PAR_LE_BACK =
  'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.';

export const MOTS_DE_PASSE = {
  robuste: 'Abcdefghij1!',
  sansMajusculeNiChiffreNiSigne: 'abcdefghijkl',
  sansSigne: 'Abcdefghijk1',
  sansMajuscule: 'abcdefghij1!',
  sansChiffre: 'Abcdefghijk!',
  court: 'Ab1!',
  onzeCaracteresEnDouzeUnites: `Abcdefgh1!${String.fromCodePoint(0x1f600)}`,
  tropLong: `Ab1!${String.fromCodePoint(0x1f600).repeat(253)}`,
} as const;

export const telephoneBienFormeDeLongueur = (longueur: number): string =>
  `06${' '.repeat(longueur - 10)}98403282`;

const BLOCS_D_UN_CHAMP = '.auth-field, .pf-field, .relative';

export async function erreursApresSaisie<T>(
  fixture: ComponentFixture<T>,
  selecteur: string,
  valeur: string,
): Promise<ValidationErrors | null> {
  const element = (fixture.nativeElement as HTMLElement).querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >(selecteur);
  if (element === null) {
    throw new Error(`Aucun champ ${selecteur} dans la page`);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  element.value = valeur;
  element.dispatchEvent(new Event('input'));
  element.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture.debugElement.query(By.css(selecteur)).injector.get(NgModel).errors;
}

function blocDuChamp<T>(
  fixture: ComponentFixture<T>,
  selecteur: string,
  blocs: string,
): Element | null {
  return (fixture.nativeElement as HTMLElement).querySelector(selecteur)?.closest(blocs) ?? null;
}

const texteNormalise = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

export function texteDuBlocDuChamp<T>(
  fixture: ComponentFixture<T>,
  selecteur: string,
  blocs = BLOCS_D_UN_CHAMP,
): string {
  return texteNormalise(blocDuChamp(fixture, selecteur, blocs));
}

export function decrireLaRegleDUnMotDePasseNeuf<T>(
  page: () => ComponentFixture<T>,
  selecteur: string,
): void {
  it('exige la longueur minimale de la constante, une majuscule, un chiffre et un caractère spécial', async () => {
    const fixture = page();
    expect(await erreursApresSaisie(fixture, selecteur, MOTS_DE_PASSE.court)).toEqual(
      jasmine.objectContaining({
        minlength: {
          requiredLength: LONGUEUR_MIN_D_UN_MOT_DE_PASSE,
          actualLength: MOTS_DE_PASSE.court.length,
        },
      }),
    );
    expect(
      await erreursApresSaisie(fixture, selecteur, MOTS_DE_PASSE.onzeCaracteresEnDouzeUnites),
    ).toEqual({
      minlength: { requiredLength: LONGUEUR_MIN_D_UN_MOT_DE_PASSE, actualLength: 11 },
    });
    for (const faible of [
      MOTS_DE_PASSE.sansMajusculeNiChiffreNiSigne,
      MOTS_DE_PASSE.sansSigne,
      MOTS_DE_PASSE.sansMajuscule,
      MOTS_DE_PASSE.sansChiffre,
    ]) {
      expect(Object.keys((await erreursApresSaisie(fixture, selecteur, faible)) ?? {}))
        .withContext(faible)
        .toEqual(['pattern']);
    }
    expect(await erreursApresSaisie(fixture, selecteur, MOTS_DE_PASSE.robuste)).toBeNull();
  });

  it('plafonne le mot de passe à 256 caractères, comme la connexion du back', async () => {
    expect(await erreursApresSaisie(page(), selecteur, MOTS_DE_PASSE.tropLong)).toEqual({
      maxlength: { requiredLength: 256, actualLength: 257 },
    });
  });

  it('annonce la règle entière avant la saisie, sans minimum écrit en dur, puis la montre en erreur', async () => {
    const fixture = page();
    expect(texteDuBlocDuChamp(fixture, selecteur)).toContain(REGLE_ATTENDUE_DU_MOT_DE_PASSE);

    await erreursApresSaisie(fixture, selecteur, MOTS_DE_PASSE.sansSigne);

    expect(
      texteNormalise(blocDuChamp(fixture, selecteur, BLOCS_D_UN_CHAMP)?.querySelector('.err')),
    ).toBe(REGLE_ATTENDUE_DU_MOT_DE_PASSE);
  });
}
