import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { AsiliKickerComponent } from './asili-kicker.component';

describe('AsiliKickerComponent', () => {
  let fixture: ComponentFixture<AsiliKickerComponent>;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [AsiliKickerComponent] }).createComponent(
      AsiliKickerComponent,
    );
  });

  it('rend le texte fourni dans un .kicker', () => {
    fixture.componentRef.setInput('texte', 'Méthode');
    fixture.detectChanges();
    const kicker = (fixture.nativeElement as HTMLElement).querySelector('span.kicker');
    expect(kicker?.textContent).toBe('Méthode');
  });

  it("ne rend rien quand aucun texte n'est fourni", () => {
    fixture.componentRef.setInput('texte', null);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).children.length).toBe(0);
  });

  it("n'ajoute pas de boite de mise en page autour du kicker", () => {
    fixture.componentRef.setInput('texte', 'Méthode');
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    expect(getComputedStyle(fixture.nativeElement as HTMLElement).display).toBe('contents');
    (fixture.nativeElement as HTMLElement).remove();
  });
});
