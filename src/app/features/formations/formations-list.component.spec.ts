import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { FormationsListComponent } from "./formations-list.component";
import { FORMATIONS } from "./formations-list.data";

describe("FormationsListComponent", () => {
  let component: FormationsListComponent;
  let fixture: ComponentFixture<FormationsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormationsListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait etre cree", () => {
    expect(component).toBeTruthy();
  });

  it("devrait exposer la liste des formations depuis les donnees statiques", () => {
    expect(component.formations).toBe(FORMATIONS);
    expect(component.formations.length).toBeGreaterThan(0);
  });

  it("devrait rendre le titre principal de la page", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toContain("Formations");
  });

  it("devrait rendre une carte pour chaque formation", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // P1.9 : la page contient desormais aussi un lien vers /offer dans la
    // FAQ. On cible uniquement les cartes (classe .group dans la grid).
    const cards = compiled.querySelectorAll("a[ng-reflect-router-link].group");
    expect(cards.length).toBe(FORMATIONS.length);
  });

  it("devrait afficher le titre de chaque formation dans sa carte", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      const found = compiled.textContent?.includes(formation.title);
      expect(found)
        .withContext(`Le titre "${formation.title}" devrait etre visible`)
        .toBeTrue();
    }
  });

  it("devrait afficher la description de chaque formation", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      const found = compiled.textContent?.includes(formation.description);
      expect(found)
        .withContext(
          `La description de "${formation.title}" devrait etre visible`,
        )
        .toBeTrue();
    }
  });

  it("devrait afficher la duree et le nombre de slides", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      expect(compiled.textContent).toContain(formation.duration);
      expect(compiled.textContent).toContain(`${formation.slidesCount} slides`);
    }
  });

  it("devrait afficher le badge de chaque formation", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    for (const formation of FORMATIONS) {
      expect(compiled.textContent).toContain(formation.badge);
    }
  });

  it("devrait avoir des liens de navigation vers chaque formation", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll("a");
    for (const formation of FORMATIONS) {
      const link = Array.from(links).find((a) =>
        a.getAttribute("ng-reflect-router-link")?.includes(formation.slug),
      );
      expect(link)
        .withContext(
          `Un lien vers /formations/${formation.slug} devrait exister`,
        )
        .toBeTruthy();
    }
  });
});
