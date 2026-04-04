import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { SEBASTIAN_PORT } from "../../core/ports/sebastian.port";
import { AuthStateService } from "../../core/services/auth-state.service";
import {
  buildAuthSession,
  buildAuthUser,
  createAuthPortStub,
} from "../../../testing/factories/auth.factory";
import { createSebastianPortStub } from "../../../testing/factories/sebastian.factory";
import { SebastianComponent } from "./sebastian.component";

describe("SebastianComponent", () => {
  let component: SebastianComponent;
  let fixture: ComponentFixture<SebastianComponent>;
  let authPortStub: ReturnType<typeof createAuthPortStub>;
  let sebastianPortStub: ReturnType<typeof createSebastianPortStub>;
  let authState: AuthStateService;

  beforeEach(async () => {
    authPortStub = createAuthPortStub();
    sebastianPortStub = createSebastianPortStub();

    // Configuration par defaut des stubs pour eviter les erreurs de subscribe
    authPortStub.login.and.returnValue(of(null));
    authPortStub.register.and.returnValue(of(null));
    authPortStub.me.and.returnValue(of(null));
    authPortStub.googleAuth.and.returnValue(of(null));

    // Configuration des stubs Sebastian pour le composant applicatif
    sebastianPortStub.getEntries.and.returnValue(of([]));
    sebastianPortStub.getGoals.and.returnValue(of([]));
    sebastianPortStub.getStats.and.returnValue(
      of({ period: "week", byCategory: [] }),
    );

    await TestBed.configureTestingModule({
      imports: [SebastianComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: authPortStub },
        { provide: SEBASTIAN_PORT, useValue: sebastianPortStub },
      ],
    }).compileComponents();

    authState = TestBed.inject(AuthStateService);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(SebastianComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("devrait se creer", () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it("devrait afficher le composant applicatif quand l utilisateur a le role sebastian", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["sebastian"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-sebastian-app");
    const presEl = fixture.nativeElement.querySelector(
      "app-sebastian-presentation",
    );
    expect(appEl).toBeTruthy();
    expect(presEl).toBeNull();
  });

  it("devrait afficher la presentation quand l utilisateur n est pas connecte", () => {
    // Arrange — aucun login

    // Act
    createComponent();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-sebastian-app");
    const presEl = fixture.nativeElement.querySelector(
      "app-sebastian-presentation",
    );
    expect(appEl).toBeNull();
    expect(presEl).toBeTruthy();
  });

  it("devrait afficher la presentation quand l utilisateur n a pas le role sebastian", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["weather"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    const appEl = fixture.nativeElement.querySelector("app-sebastian-app");
    const presEl = fixture.nativeElement.querySelector(
      "app-sebastian-presentation",
    );
    expect(appEl).toBeNull();
    expect(presEl).toBeTruthy();
  });

  it("hasAccess devrait retourner true si connecte avec le bon role", () => {
    // Arrange
    createComponent();
    authState.login(
      buildAuthSession({ user: buildAuthUser({ roles: ["sebastian"] }) }),
    );

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.hasAccess()).toBeTrue();
  });

  it("hasAccess devrait retourner false si non connecte", () => {
    // Arrange — aucun login

    // Act
    createComponent();

    // Assert
    expect(component.hasAccess()).toBeFalse();
  });
});
