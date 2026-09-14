import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import type { VoteOption, VoteQuestionPublique } from '../../../../cours/runtime/blocks/FpVote';
import type { FormationsPort } from '../../../core/ports/formations.port';
import { FORMATIONS_PORT } from '../../../core/ports/formations.port';
import { createFormationsPortStub } from '../../../../testing/factories/formations.factory';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { CoursPresentateurComponent } from './cours-presentateur.component';

type Fixture = ComponentFixture<CoursPresentateurComponent>;

type BriqueVote = HTMLElement & { question: VoteQuestionPublique | null };

const COURSE_SLUG = 'maths-financieres';

const QUESTION = {
  id: 'Q-CAP-03',
  enonce: 'Un capital de 1 000 € placé à 4 % pendant 10 ans vaut environ :',
  options: [
    { id: 'a', libelle: '1 400 €', misconception: 'interets-simples' },
    { id: 'b', libelle: '1 480,24 €', misconception: null },
  ],
};

function doubleDuPort(): jasmine.SpyObj<FormationsPort> {
  const port = createFormationsPortStub();
  port.ouvrirSeance.and.returnValue(of({ sessionId: 'S-1', code: '4821' }));
  return port;
}

function cible(fixture: Fixture, nom: string): HTMLElement {
  const racine = fixture.nativeElement as HTMLElement;
  const element = racine.querySelector<HTMLElement>(`[data-testid='${nom}']`);
  if (element === null) {
    throw new Error(`Aucun element « ${nom} » dans la vue presentateur`);
  }
  return element;
}

async function cliquer(fixture: Fixture, nom: string): Promise<void> {
  (cible(fixture, nom) as HTMLButtonElement).click();
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
}

async function monter(
  port: jasmine.SpyObj<FormationsPort>,
  question: VoteQuestionPublique | null = null,
): Promise<Fixture> {
  setupTestBed({
    imports: [CoursPresentateurComponent],
    providers: [{ provide: FORMATIONS_PORT, useValue: port }],
  });
  await TestBed.compileComponents();
  const fixture = TestBed.createComponent(CoursPresentateurComponent);
  fixture.componentRef.setInput('courseSlug', COURSE_SLUG);
  fixture.componentRef.setInput('question', question);
  fixture.detectChanges();
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
  return fixture;
}

async function ouvrirLaSeance(
  port: jasmine.SpyObj<FormationsPort>,
  question: VoteQuestionPublique | null = null,
): Promise<Fixture> {
  const fixture = await monter(port, question);
  await cliquer(fixture, 'presentateur-ouvrir');
  return fixture;
}

describe('CoursPresentateurComponent', () => {
  let port: jasmine.SpyObj<FormationsPort>;

  beforeEach(() => {
    port = doubleDuPort();
    spyOn(globalThis, 'fetch').and.returnValue(new Promise<Response>(() => undefined));
  });

  it('affiche le code de seance en tres grand des l ouverture', async () => {
    const fixture = await ouvrirLaSeance(port);

    const affichage = cible(fixture, 'presentateur-code');
    expect(affichage.textContent?.trim()).toBe('4821');
    expect(parseFloat(getComputedStyle(affichage).fontSize))
      .withContext('le code doit se lire depuis le fond de la salle')
      .toBeGreaterThanOrEqual(64);
  });

  it('compte les participants annonces par le flux de la seance', async () => {
    let pousser = (texte: string): void => {
      throw new Error(`Le flux n est pas ouvert : « ${texte} » n a pas pu partir`);
    };
    const corps = new ReadableStream<Uint8Array>({
      start: (controleur) => {
        pousser = (texte) => controleur.enqueue(new TextEncoder().encode(texte));
      },
    });
    (globalThis.fetch as jasmine.Spy).and.returnValue(
      Promise.resolve(new Response(corps, { status: 200 })),
    );
    const fixture = await ouvrirLaSeance(port);

    pousser(
      'data: {"etat":"en_cours","modeRythme":"pilote","ecranCourant":0,"intervalleLibre":null,"participants":12}\n\n',
    );
    await fixture.componentInstance.quandLeFluxAParle();
    fixture.detectChanges();

    expect(cible(fixture, 'presentateur-participants-nombre').textContent?.trim()).toBe('12');
  });

  it('avance l ecran affiche sans attendre l echo du flux', async () => {
    const commande = new Subject<void>();
    port.piloter.and.returnValue(commande.asObservable());
    const fixture = await ouvrirLaSeance(port);

    (cible(fixture, 'presentateur-suivant') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cible(fixture, 'presentateur-ecran').textContent?.trim()).toBe('1');
    expect(port.piloter).toHaveBeenCalledWith('S-1', { ecran: 1 });
  });

  it('un double clic sur suivant n avance que d un ecran', async () => {
    const commande = new Subject<void>();
    port.piloter.and.returnValue(commande.asObservable());
    const fixture = await ouvrirLaSeance(port);
    const suivant = cible(fixture, 'presentateur-suivant') as HTMLButtonElement;

    suivant.click();
    suivant.click();
    fixture.detectChanges();

    expect(port.piloter).toHaveBeenCalledTimes(1);
    expect(cible(fixture, 'presentateur-ecran').textContent?.trim()).toBe('1');

    commande.complete();
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();
    suivant.click();
    fixture.detectChanges();

    expect(port.piloter).toHaveBeenCalledTimes(2);
    expect(cible(fixture, 'presentateur-ecran').textContent?.trim()).toBe('2');
  });

  it('bascule le rythme et transmet l intervalle libre', async () => {
    const fixture = await ouvrirLaSeance(port);

    await cliquer(fixture, 'presentateur-rythme');

    expect(port.piloter).toHaveBeenCalledWith('S-1', {
      mode: 'libre',
      intervalle: { premier: 1, dernier: 3 },
    });
    expect(cible(fixture, 'presentateur-rythme-mode').textContent?.trim()).toBe('libre');

    await cliquer(fixture, 'presentateur-rythme');

    expect(port.piloter).toHaveBeenCalledWith('S-1', { mode: 'pilote' });
    expect(cible(fixture, 'presentateur-rythme-mode').textContent?.trim()).toBe('pilote');
  });

  it('monte la brique en role presentateur avec sa partie notee', async () => {
    const fixture = await ouvrirLaSeance(port, QUESTION);
    await customElements.whenDefined('fp-vote');
    fixture.detectChanges();

    const brique = cible(fixture, 'presentateur-brique') as BriqueVote;
    expect(brique.getAttribute('role')).toBe('presentateur');
    const options = (brique.question?.options ?? []) as readonly VoteOption[];
    expect(options.length).toBe(2);
    expect(options[0].misconception)
      .withContext('la partie notee doit rester disponible au presentateur')
      .toBe('interets-simples');
  });

  it('la cloture demande confirmation et ne part qu une fois', async () => {
    const fermeture = new Subject<void>();
    port.cloturer.and.returnValue(fermeture.asObservable());
    const fixture = await ouvrirLaSeance(port);

    await cliquer(fixture, 'presentateur-cloturer');

    expect(cible(fixture, 'presentateur-cloture-confirmation')).toBeTruthy();
    expect(port.cloturer).not.toHaveBeenCalled();

    const confirmer = cible(fixture, 'presentateur-cloture-confirmer') as HTMLButtonElement;
    confirmer.click();
    confirmer.click();
    fixture.detectChanges();

    expect(port.cloturer).toHaveBeenCalledTimes(1);

    fermeture.complete();
    await fixture.componentInstance.quandStabilise();
    fixture.detectChanges();

    expect(cible(fixture, 'presentateur-terminee')).toBeTruthy();
  });
});
