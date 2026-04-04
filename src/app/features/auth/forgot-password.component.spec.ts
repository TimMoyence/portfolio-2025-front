import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Observable, of } from "rxjs";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { createAuthPortStub } from "../../../testing/factories/auth.factory";
import { ForgotPasswordComponent } from "./forgot-password.component";

describe("ForgotPasswordComponent", () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: ReturnType<typeof createAuthPortStub>;

  beforeEach(async () => {
    authService = createAuthPortStub();

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_PORT, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("appelle le service quand le formulaire est valide", () => {
    authService.requestPasswordReset.and.returnValue(
      of({ message: "Lien envoye" }),
    );

    component.email = "john@example.com";
    component.submit({
      invalid: false,
      resetForm: jasmine.createSpy("resetForm"),
    } as never);

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: "john@example.com",
    });
    expect(component.successMessage).toBe("Lien envoye");
  });

  it("ne devrait pas appeler le service si le formulaire est invalide", () => {
    component.submit({ invalid: true } as never);

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.submitted).toBeTrue();
  });

  it("devrait afficher le message d erreur en cas d echec", () => {
    authService.requestPasswordReset.and.returnValue(
      new Observable((sub) =>
        sub.error({ error: { message: "Utilisateur inconnu" } }),
      ),
    );

    component.email = "unknown@example.com";
    component.submit({
      invalid: false,
      resetForm: jasmine.createSpy("resetForm"),
    } as never);

    expect(component.errorMessage).toBe("Utilisateur inconnu");
  });
});
