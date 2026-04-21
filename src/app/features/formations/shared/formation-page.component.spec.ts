import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { APP_CONFIG } from "../../../core/config/app-config.token";
import { LEAD_MAGNET_PORT } from "../../../core/ports/lead-magnet.port";
import { buildAppConfig } from "../../../../testing/factories/app-config.factory";
import { createLeadMagnetPortStub } from "../../../../testing/factories/lead-magnet.factory";
import { FormationPageComponent } from "./formation-page.component";

/**
 * Tests de `FormationPageComponent` — resolution par slug via la registry
 * et fallback "introuvable" pour un slug inconnu. Couvre les deux modes
 * de resolution du slug :
 *  - via `data.formationSlug` (routes statiques generees par
 *    `buildFormationRoutes`),
 *  - via `paramMap.slug` (futur support d'une route parametree).
 */
describe("FormationPageComponent", () => {
  let fixture: ComponentFixture<FormationPageComponent>;

  const setup = async (options: {
    slugFromData?: string;
    slugFromParam?: string;
  }): Promise<void> => {
    const data$ = new BehaviorSubject<Record<string, unknown>>(
      options.slugFromData !== undefined
        ? { formationSlug: options.slugFromData }
        : {},
    );
    const paramMap$ = new BehaviorSubject(
      convertToParamMap(
        options.slugFromParam !== undefined
          ? { slug: options.slugFromParam }
          : {},
      ),
    );

    await TestBed.configureTestingModule({
      imports: [FormationPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: buildAppConfig() },
        { provide: LEAD_MAGNET_PORT, useValue: createLeadMagnetPortStub() },
        {
          provide: ActivatedRoute,
          useValue: {
            data: data$.asObservable(),
            paramMap: paramMap$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormationPageComponent);
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("rend la presentation quand `data.formationSlug` correspond a une formation publiee", async () => {
    await setup({ slugFromData: "ia-solopreneurs" });

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("app-presentation-engine")).not.toBeNull();
    const h1 = host.querySelector("h1.sr-only");
    expect(h1?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("supporte la resolution par `paramMap.slug` en fallback", async () => {
    await setup({ slugFromParam: "ia-solopreneurs" });

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("app-presentation-engine")).not.toBeNull();
  });

  it("affiche un fallback explicite pour un slug inconnu", async () => {
    await setup({ slugFromData: "slug-inconnu" });

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector("app-presentation-engine")).toBeNull();
    const heading = host.querySelector("#formation-unknown-heading");
    expect(heading?.textContent?.toLowerCase()).toContain("formation");
  });
});
