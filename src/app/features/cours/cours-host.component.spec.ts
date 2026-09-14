import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { clearIdentity, saveIdentity } from '../../../cours/runtime/core/identity';
import { BLOCS } from '../../../cours/runtime/core/register';
import { seedFromKey } from '../../../cours/runtime/core/seed';
import { saturationDuStockage } from '../../../testing/sans-stockage';
import { CoursHostComponent } from './cours-host.component';

const IDENTITE_THEO = { prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' };

const MOTS_DE_CORRECTION = [
  'misconception',
  'bareme',
  'barème',
  'corrige',
  'bonneReponse',
  'reponseAttendue',
];

function renduComplet(hote: HTMLElement): string {
  const ombres = [...hote.querySelectorAll('*')]
    .map((element) => element.shadowRoot?.innerHTML ?? '')
    .join('\n');
  return `${hote.innerHTML}\n${ombres}`;
}

async function attendreQue(
  fixture: ComponentFixture<CoursHostComponent>,
  condition: () => boolean,
  attendu: string,
): Promise<void> {
  await fixture.componentInstance.quandStabilise();
  fixture.detectChanges();
  if (!condition()) {
    throw new Error(
      `Etat stabilise sans que la condition « ${attendu} » soit remplie : etat=${fixture.componentInstance.etat()}`,
    );
  }
}

async function attendreFinDuChargement(
  fixture: ComponentFixture<CoursHostComponent>,
): Promise<void> {
  await attendreQue(
    fixture,
    () => fixture.componentInstance.etat() !== 'chargement',
    'le chargement est termine',
  );
}

function soumettreIdentite(
  fixture: ComponentFixture<CoursHostComponent>,
  valeurs: Record<string, string>,
): void {
  fixture.detectChanges();
  const formulaire = fixture.nativeElement.querySelector(
    "[data-testid='cours-identite']",
  ) as HTMLFormElement;
  for (const [nom, valeur] of Object.entries(valeurs)) {
    const champ = formulaire.querySelector<HTMLInputElement>(`[name='${nom}']`);
    if (champ) {
      champ.value = valeur;
    }
  }
  formulaire.dispatchEvent(new Event('submit'));
}

async function monterPret(): Promise<ComponentFixture<CoursHostComponent>> {
  const montee = TestBed.createComponent(CoursHostComponent);
  montee.detectChanges();
  await attendreFinDuChargement(montee);
  return montee;
}

describe('CoursHostComponent', () => {
  let fixture: ComponentFixture<CoursHostComponent>;

  beforeEach(async () => {
    clearIdentity();
    await TestBed.configureTestingModule({
      imports: [CoursHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CoursHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    clearIdentity();
  });

  it('se cree sans erreur', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche un etat de chargement avant l enregistrement des briques', () => {
    const chargement = fixture.nativeElement.querySelector("[data-testid='cours-chargement']");
    expect(chargement).toBeTruthy();
  });

  it('demande l identite quand elle est absente', async () => {
    await attendreFinDuChargement(fixture);
    const formulaire = fixture.nativeElement.querySelector("[data-testid='cours-identite']");
    expect(formulaire).toBeTruthy();
  });

  it('cable une question de demonstration une fois pret', async () => {
    saveIdentity(IDENTITE_THEO);
    try {
      const pret = await monterPret();
      const brique = pret.nativeElement.querySelector('fp-vote') as HTMLElement & {
        question?: { id: string } | null;
      };
      expect(brique.question?.id).toBe('Q-CAP-03');
    } finally {
      clearIdentity();
    }
  });

  it('monte chaque brique de la table en role etudiant sans qu aucune ne leve', async () => {
    saveIdentity(IDENTITE_THEO);
    try {
      const pret = await monterPret();
      const hote = pret.nativeElement as HTMLElement;
      await Promise.all(BLOCS.map((bloc) => customElements.whenDefined(bloc.nom)));
      pret.detectChanges();

      expect(BLOCS.length).toBeGreaterThan(0);
      for (const bloc of BLOCS) {
        const brique = hote.querySelector(bloc.nom);
        expect(brique)
          .withContext(`${bloc.nom} n est pas monte sur la page de demonstration`)
          .toBeTruthy();
        expect(brique?.shadowRoot?.childElementCount ?? 0)
          .withContext(`${bloc.nom} n a rien rendu : son renderHand a leve`)
          .toBeGreaterThan(0);
        expect((brique as HTMLElement).getAttribute('role'))
          .withContext(`${bloc.nom} n est pas monte en role etudiant`)
          .toBeNull();
      }
    } finally {
      clearIdentity();
    }
  });

  it('ne sert aucune donnee de correction dans le HTML de la page de demonstration', async () => {
    saveIdentity(IDENTITE_THEO);
    try {
      const pret = await monterPret();
      const rendu = renduComplet(pret.nativeElement as HTMLElement);
      expect(MOTS_DE_CORRECTION.length).toBeGreaterThan(0);
      for (const mot of MOTS_DE_CORRECTION) {
        expect(rendu)
          .withContext(`« ${mot} » apparait dans le HTML servi a l etudiant`)
          .not.toContain(mot);
      }
    } finally {
      clearIdentity();
    }
  });

  it('seme le melange des options depuis la cle de l etudiant', async () => {
    const enregistrement = saveIdentity(IDENTITE_THEO);
    try {
      const pret = await monterPret();
      expect(pret.componentInstance.graine()).toBe(seedFromKey(enregistrement.identite.studentKey));
      expect(pret.componentInstance.graine()).not.toBe(0);
    } finally {
      clearIdentity();
    }
  });

  it('demarre la seance et avertit l etudiant quand le poste ne peut rien memoriser', async () => {
    spyOn(globalThis.localStorage, 'setItem').and.throwError(saturationDuStockage());
    try {
      await attendreFinDuChargement(fixture);
      expect(fixture.componentInstance.etat()).toBe('identite');
      soumettreIdentite(fixture, IDENTITE_THEO);
      await attendreQue(
        fixture,
        () => fixture.componentInstance.etat() === 'pret',
        'le poste est pret',
      );
      expect(fixture.componentInstance.etat()).toBe('pret');
      expect(
        fixture.nativeElement.querySelector("[data-testid='cours-sans-memoire']"),
      ).toBeTruthy();
      expect(fixture.nativeElement.querySelector("[data-testid='cours-erreur']")).toBeNull();
      expect(fixture.nativeElement.querySelector('fp-vote')).toBeTruthy();
    } finally {
      clearIdentity();
    }
  });

  it('une identite refusee ramene au formulaire sans accuser le chargement du cours', async () => {
    await attendreFinDuChargement(fixture);
    expect(fixture.componentInstance.etat()).toBe('identite');
    soumettreIdentite(fixture, { ...IDENTITE_THEO, email: 'pas-une-adresse' });
    await attendreQue(
      fixture,
      () => fixture.componentInstance.identiteRefusee(),
      'l identite est refusee',
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.etat()).toBe('identite');
    expect(
      fixture.nativeElement.querySelector("[data-testid='cours-identite-refus']"),
    ).toBeTruthy();
    expect(fixture.nativeElement.querySelector("[data-testid='cours-erreur']")).toBeNull();
    expect(fixture.nativeElement.querySelector("[data-testid='cours-identite']")).toBeTruthy();
  });
});
