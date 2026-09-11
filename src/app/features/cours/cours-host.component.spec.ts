import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { clearIdentity, saveIdentity } from '../../../cours/runtime/core/identity';
import { seedFromKey } from '../../../cours/runtime/core/seed';
import { CoursHostComponent } from './cours-host.component';

const IDENTITE_THEO = { prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' };

const DELAI_ATTENTE_MS = 50;
const ESSAIS_MAX = 20;

async function attendreFinDuChargement(
  fixture: ComponentFixture<CoursHostComponent>,
): Promise<void> {
  for (let essai = 0; essai < ESSAIS_MAX; essai += 1) {
    if (fixture.componentInstance.etat() !== 'chargement') {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, DELAI_ATTENTE_MS));
    fixture.detectChanges();
  }
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
    await TestBed.configureTestingModule({
      imports: [CoursHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CoursHostComponent);
    fixture.detectChanges();
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

  it('seme le melange des options depuis la cle de l etudiant', async () => {
    const identite = saveIdentity(IDENTITE_THEO);
    try {
      const pret = await monterPret();
      expect(pret.componentInstance.graine()).toBe(seedFromKey(identite.studentKey));
      expect(pret.componentInstance.graine()).not.toBe(0);
    } finally {
      clearIdentity();
    }
  });
});
