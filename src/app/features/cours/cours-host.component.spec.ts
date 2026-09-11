import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { CoursHostComponent } from './cours-host.component';

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
});
