import type { ComponentFixture } from '@angular/core/testing';

export interface EnTeteDeSection {
  readonly kicker: string;
  readonly heading: string;
  readonly intro: string;
}

export function decrireEnTeteDeSection(
  monter: () => ComponentFixture<unknown>,
  selecteurIntro: string,
  enTete: EnTeteDeSection,
): void {
  it("affiche le kicker, le titre <h2> et l'intro quand fournis en inputs", () => {
    const fixture = monter();
    for (const [nom, valeur] of Object.entries(enTete)) {
      fixture.componentRef.setInput(nom, valeur);
    }
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.kicker')?.textContent).toContain(enTete.kicker);
    expect(racine.querySelector('h2')?.textContent).toContain(enTete.heading);
    expect(racine.querySelector(selecteurIntro)?.textContent).toContain(enTete.intro);
  });

  it("n'affiche ni kicker ni titre ni intro quand non fournis", () => {
    const fixture = monter();
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.kicker')).toBeNull();
    expect(racine.querySelector('h2')).toBeNull();
    expect(racine.querySelector(selecteurIntro)).toBeNull();
  });
}
