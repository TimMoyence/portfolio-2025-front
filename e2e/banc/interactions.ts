import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const DELAI_DE_RETOUR_MS = 15_000;

const BRIQUES = [
  'fp-recall',
  'fp-pro',
  'fp-cardsort',
  'fp-challenge',
  'fp-pulse',
  'fp-plot',
  'fp-concept4',
  'fp-worked',
  'fp-sheet',
  'fp-table-build',
  'fp-escape',
  'fp-spaced',
  'fp-exit',
  'fp-vote',
  'fp-numeric',
  'fp-story',
] as const;

export type NatureDEcran =
  | (typeof BRIQUES)[number]
  | 'questionnaire'
  | 'fp-worked-pilote'
  | 'reflection'
  | 'method-path'
  | 'grid'
  | 'verrouille'
  | 'recit';

export type Revelation =
  'correction' | 'defi' | 'feuille' | 'tableau' | 'etayage' | 'jumelle' | 'aucune';

const SIGNES_DE_CORRECTION = [
  '[data-testid="bonne-reponse"]',
  '[data-correction]',
  'details[data-testid="slide-reflection-debrief"][open]',
  '[data-testid="solution"]',
].join(', ');

const TENTATIVES_PAR_ENIGME = 10;

const SANS_MARQUE_DE_REVELATION: ReadonlySet<NatureDEcran> = new Set([
  'fp-pulse',
  'fp-worked',
  'fp-story',
  'recit',
]);

function principal(page: Page): Locator {
  return page.locator('[data-testid="cours-contenu"]');
}

function texteRapide(numero: number, sujet: string): string {
  return `${sujet} poste ${numero} : unité, période, source et base 100 vérifiées.`;
}

async function taperVite(champ: Locator, texte: string, numero: number): Promise<void> {
  if (numero % 2 === 0) {
    await champ.pressSequentially(texte, { delay: 0 });
  } else {
    await champ.fill(texte);
  }
}

export async function natureDeLEcran(page: Page): Promise<NatureDEcran> {
  const zone = principal(page);
  await expect(zone).toBeVisible();
  return zone.evaluate(
    (element, briques) => {
      if (element.querySelector('[data-testid="slide-activity-verrouille"]') !== null) {
        return 'verrouille';
      }
      const blocs = element.querySelectorAll('fp-vote, fp-numeric');
      if (blocs.length > 1) return 'questionnaire';
      const worked = element.querySelector('fp-worked');
      if (worked?.shadowRoot?.querySelector('[data-pilote="true"]') != null) {
        return 'fp-worked-pilote';
      }
      const brique = briques.find((nom) => element.querySelector(nom) !== null);
      if (brique !== undefined) return brique;
      if (element.querySelector('app-slide-reflection') !== null) return 'reflection';
      if (element.querySelector('app-slide-method-path') !== null) return 'method-path';
      if (element.querySelector('app-slide-grid') !== null) return 'grid';
      return 'recit';
    },
    [...BRIQUES],
  ) as Promise<NatureDEcran>;
}

async function cliquerUneOption(bloc: Locator, numero: number): Promise<void> {
  const options = bloc.locator(
    '[data-testid="options"] [data-testid="option"], [data-testid="option"]',
  );
  await expect(options.first()).toBeEnabled({ timeout: DELAI_DE_RETOUR_MS });
  const nombre = await options.count();
  await options.nth(numero % nombre).click();
}

async function voter(bloc: Locator, numero: number): Promise<void> {
  await cliquerUneOption(bloc, numero);
  await expect(bloc.locator('[data-testid="option"]').first()).toBeDisabled({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function repondreAuNumerique(bloc: Locator, numero: number): Promise<void> {
  await taperVite(bloc.locator('[data-testid="champ"]'), `${12 + numero},5`, numero);
  await bloc.locator('[data-testid="valider"]').click();
  await expect(bloc.locator('[data-testid="verdict"]')).toBeVisible({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function questionnaire(zone: Locator, numero: number): Promise<void> {
  const votes = zone.locator('fp-vote');
  const numeriques = zone.locator('fp-numeric');
  for (let rang = 0; rang < (await votes.count()); rang += 1) {
    await voter(votes.nth(rang), numero + rang);
  }
  for (let rang = 0; rang < (await numeriques.count()); rang += 1) {
    await repondreAuNumerique(numeriques.nth(rang), numero + rang);
  }
}

async function rappel(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-recall');
  await taperVite(bloc.locator('[data-testid="rappel"]'), texteRapide(numero, 'Rappel'), numero);
  await cliquerUneOption(bloc, numero);
  await expect(bloc.locator('[data-testid="verdict"]')).toBeVisible({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function reflexion(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('app-slide-reflection');
  await taperVite(bloc.locator('textarea'), texteRapide(numero, 'Réflexion'), numero);
  await bloc.getByRole('button', { name: 'Garder cette réflexion' }).click();
  await expect(zone.getByTestId('slide-reflection-etat')).toHaveAttribute(
    'data-etat',
    'enregistre',
    { timeout: DELAI_DE_RETOUR_MS },
  );
}

async function pro(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-pro');
  const champs = bloc.locator('textarea[data-question]');
  for (let rang = 0; rang < (await champs.count()); rang += 1) {
    await taperVite(champs.nth(rang), texteRapide(numero + rang, 'Mission'), numero + rang);
  }
  await bloc.locator('[data-testid="valider"]').click();
  await expect(bloc.locator('[data-testid="retour"]')).not.toBeEmpty({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function classement(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-cardsort');
  const piles = await bloc
    .locator('[data-testid="pile"]:not([data-zone=""])')
    .evaluateAll((listes) => listes.map((liste) => liste.getAttribute('data-zone') ?? ''));
  const cartes = await bloc
    .locator('[data-testid="carte"]')
    .evaluateAll((boutons) => boutons.map((bouton) => bouton.getAttribute('data-carte') ?? ''));
  for (const [rang, carteId] of cartes.entries()) {
    const zoneCible = piles[(numero + rang) % piles.length];
    const carte = bloc.locator(`[data-testid="carte"][data-carte="${carteId}"]`);
    if ((numero + rang) % 2 === 0) {
      await carte.dragTo(bloc.locator(`[data-testid="pile"][data-zone="${zoneCible}"]`));
    } else {
      await carte.click();
      await bloc.locator('[data-testid="cible"]').selectOption(zoneCible);
      await bloc.locator('[data-testid="deplacer"]').click();
    }
  }
  await expect(bloc.locator('[data-testid="progression"]')).toHaveText(
    new RegExp(`${cartes.length}\\s*/\\s*${cartes.length}`),
  );
  await bloc.locator('[data-testid="valider"]').click();
  await expect(bloc.locator('[data-testid="verdict"]')).toBeVisible({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function defi(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-challenge');
  await taperVite(bloc.locator('[data-testid="tentative"]'), texteRapide(numero, 'Défi'), numero);
  await bloc.locator('[data-testid="envoyer"]').click();
  await expect(bloc.locator('[data-testid="retour"]')).not.toBeEmpty({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function pouls(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-pulse');
  const etats = bloc.locator('[data-testid="etat"]');
  await etats.nth(numero % 3).click();
  const final = etats.nth((numero + 1) % 3);
  await final.click();
  await expect(final).toHaveAttribute('aria-pressed', 'true', { timeout: DELAI_DE_RETOUR_MS });
}

async function curseurs(zone: Locator, nom: string, numero: number): Promise<void> {
  const bloc = zone.locator(nom);
  const reglages = bloc.locator('[data-testid="prereglage"]');
  if ((await reglages.count()) > 0) {
    await reglages.nth(numero % (await reglages.count())).click();
  }
  const curseur = bloc.locator('input[data-testid="curseur"]').first();
  await curseur.focus();
  await curseur.press(numero % 2 === 0 ? 'ArrowRight' : 'ArrowLeft');
}

async function exempleResolu(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-worked');
  const saisies = bloc.locator('textarea[data-testid="saisie"]:not([disabled])');
  const nombre = await saisies.count();
  for (let rang = 0; rang < nombre; rang += 1) {
    const saisie = saisies.nth(0);
    await taperVite(saisie, texteRapide(numero + rang, 'Étape'), numero + rang);
    await saisie.blur();
  }
  await bloc.locator('[data-testid="valider"]').click();
  await expect(bloc.locator('[data-testid="retour"]')).not.toBeEmpty({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function feuille(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-sheet');
  const cellule = bloc.locator('input[data-testid="cellule"]:not([readonly])').first();
  await cellule.click();
  await cellule.pressSequentially(`=${numero}+1`, { delay: 0 });
  await cellule.press('Enter');
  await bloc.locator('[data-testid="valider"]').click();
  await expect(bloc.locator('[data-testid="verdict"]')).toBeVisible({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function tableau(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-table-build');
  const saisies = bloc.locator('input[data-testid="cellule"][data-role="saisie"]');
  for (let rang = 0; rang < (await saisies.count()); rang += 1) {
    await taperVite(saisies.nth(rang), String(100 + numero + rang), numero + rang);
  }
  await bloc.locator('[data-testid="valider"]').click();
  await expect(bloc.locator('[data-testid="verdict"]')).toBeVisible({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function evasion(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-escape');
  const ouverte = bloc.locator('[data-testid="enigme"][data-etat="ouverte"]');
  const restantes = ouverte.locator('[data-testid="tentatives-restantes"]');
  const avant = (await restantes.textContent()) ?? '';
  const saisie = ouverte.locator('[data-testid="saisie"]');
  await saisie.pressSequentially(`essai ${numero}`, { delay: 0 });
  await saisie.press('Enter');
  await expect(restantes).not.toHaveText(avant, { timeout: DELAI_DE_RETOUR_MS });
}

async function espace(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-spaced');
  const termine = bloc.locator('[data-testid="termine"]');
  for (let tour = 0; tour < 20 && !(await termine.isVisible()); tour += 1) {
    const option = bloc.locator('[data-testid="options"] [data-testid="option"]').first();
    await expect(option.or(termine)).toBeVisible({ timeout: DELAI_DE_RETOUR_MS });
    if (await termine.isVisible()) break;
    await cliquerUneOption(bloc.locator('[data-testid="options"]'), numero + tour);
  }
  await expect(termine).toBeVisible({ timeout: DELAI_DE_RETOUR_MS });
}

async function billetDeSortie(zone: Locator, numero: number): Promise<void> {
  const bloc = zone.locator('fp-exit');
  await cliquerUneOption(bloc, numero);
  await taperVite(
    bloc.locator('[data-testid="texte-libre"]'),
    texteRapide(numero, 'Sortie'),
    numero,
  );
  await bloc.locator('[data-testid="envoyer"]').click();
  await expect(bloc.locator('[data-testid="recap"]')).toBeVisible({
    timeout: DELAI_DE_RETOUR_MS,
  });
}

async function parcourirLeRecit(zone: Locator, selecteur: string): Promise<void> {
  const boutons = zone.locator(selecteur);
  for (let rang = 0; rang < (await boutons.count()); rang += 1) {
    await boutons.nth(rang).click();
  }
}

export async function interagirAvecLEcran(
  page: Page,
  nature: NatureDEcran,
  numero: number,
): Promise<void> {
  const zone = principal(page);
  switch (nature) {
    case 'questionnaire':
    case 'fp-numeric':
      return questionnaire(zone, numero);
    case 'fp-vote':
      return voter(zone.locator('fp-vote'), numero);
    case 'fp-recall':
      return rappel(zone, numero);
    case 'reflection':
      return reflexion(zone, numero);
    case 'fp-pro':
      return pro(zone, numero);
    case 'fp-cardsort':
      return classement(zone, numero);
    case 'fp-challenge':
      return defi(zone, numero);
    case 'fp-pulse':
      return pouls(zone, numero);
    case 'fp-plot':
    case 'fp-concept4':
      return curseurs(zone, nature, numero);
    case 'fp-worked':
      return exempleResolu(zone, numero);
    case 'fp-sheet':
      return feuille(zone, numero);
    case 'fp-table-build':
      return tableau(zone, numero);
    case 'fp-escape':
      return evasion(zone, numero);
    case 'fp-spaced':
      return espace(zone, numero);
    case 'fp-exit':
      return billetDeSortie(zone, numero);
    case 'method-path':
      return parcourirLeRecit(zone, 'button.slide-method-path__step');
    case 'grid':
      return parcourirLeRecit(zone, 'button.slide-grid__card--flip');
    case 'fp-worked-pilote':
    case 'fp-story':
    case 'verrouille':
    case 'recit':
      return undefined;
  }
}

export async function reponsesAffichees(page: Page, nature: NatureDEcran): Promise<number> {
  const zone = principal(page);
  if (nature === 'fp-spaced') {
    return zone.locator('fp-spaced [data-testid="bilan"] [data-testid="ligne"]').count();
  }
  const restantes = await zone
    .locator(
      'fp-escape [data-testid="enigme"][data-etat="ouverte"] [data-testid="tentatives-restantes"]',
    )
    .textContent();
  const dernierMot = (restantes ?? '').trim().split(/\s+/).at(-1);
  return TENTATIVES_PAR_ENIGME - Number(dernierMot ?? TENTATIVES_PAR_ENIGME);
}

async function cliquerSiActif(pupitre: Page, testId: string): Promise<boolean> {
  const bouton = pupitre.getByTestId(testId);
  if ((await bouton.count()) === 0 || !(await bouton.isEnabled())) {
    return false;
  }
  await bouton.click();
  await expect(bouton).toBeDisabled();
  return true;
}

export async function preparerDepuisLePupitre(pupitre: Page): Promise<void> {
  await cliquerSiActif(pupitre, 'activite-afficher-options');
}

export async function passerALaPhase(pupitre: Page, phase: string): Promise<void> {
  await pupitre.getByTestId('activite-phase-suivante').click();
  await expect(pupitre.getByTestId('activite-phase-courante')).toHaveText(phase);
}

export async function aUneJumelle(pupitre: Page): Promise<boolean> {
  return (await pupitre.getByTestId('activite-phase').count()) > 0;
}

export async function revelerDepuisLePupitre(pupitre: Page): Promise<Revelation> {
  if (await cliquerSiActif(pupitre, 'activite-feuille-formules')) {
    await cliquerDesQuActif(pupitre, 'activite-feuille-reponses');
    return 'feuille';
  }
  if (await cliquerSiActif(pupitre, 'activite-tableau-coefficients')) {
    await cliquerDesQuActif(pupitre, 'activite-tableau-valeurs');
    return 'tableau';
  }
  if (await cliquerSiActif(pupitre, 'activite-reveler')) {
    return 'defi';
  }
  if (
    (await cliquerSiActif(pupitre, 'activite-reveler-correction')) ||
    (await cliquerSiActif(pupitre, 'presentateur-questions-reveler'))
  ) {
    return 'correction';
  }
  return (await corrigerChaqueEtape(pupitre)) ? 'etayage' : 'aucune';
}

async function cliquerDesQuActif(pupitre: Page, testId: string): Promise<void> {
  const bouton = pupitre.getByTestId(testId);
  await expect(bouton).toBeEnabled();
  await bouton.click();
  await expect(bouton).toBeDisabled();
}

async function corrigerChaqueEtape(pupitre: Page): Promise<boolean> {
  const niveau = pupitre.getByTestId('activite-etayage-niveau');
  if ((await niveau.count()) === 0) {
    return false;
  }
  const [, etapes] = ((await niveau.textContent()) ?? '').split('/').map((part) => Number(part));
  for (let etape = 1; etape <= etapes; etape += 1) {
    await pupitre.getByTestId('activite-etayage-plus').click();
    await expect(niveau).toHaveText(`${etape} / ${etapes}`);
  }
  return etapes > 0;
}

export async function attendreLaRevelation(
  page: Page,
  nature: NatureDEcran,
  revelation: Revelation,
): Promise<void> {
  const zone = principal(page);
  const options = { timeout: DELAI_DE_RETOUR_MS };
  switch (revelation) {
    case 'feuille':
      return expect(zone.locator('fp-sheet [data-testid="attendu"]').first()).toBeVisible(options);
    case 'tableau':
      return expect(zone.locator('fp-table-build [data-testid="tableau-corrige"]')).toBeVisible(
        options,
      );
    case 'defi':
      return expect(zone.locator('fp-challenge details[data-testid="revelation"]')).toHaveAttribute(
        'open',
        '',
        options,
      );
    case 'etayage':
      return expect(zone.locator('fp-worked [data-resolue="true"]').first()).toBeVisible(options);
    case 'jumelle':
      return expect(zone.locator('fp-vote [data-testid="verdict"]')).toBeVisible(options);
    case 'correction':
      if (SANS_MARQUE_DE_REVELATION.has(nature)) return undefined;
      if (nature === 'fp-exit') {
        return expect(zone.locator('fp-exit [data-testid="reponses-closes"]')).toBeVisible(options);
      }
      return expect(zone.locator(SIGNES_DE_CORRECTION).first()).toBeVisible(options);
    case 'aucune':
      return undefined;
  }
}
