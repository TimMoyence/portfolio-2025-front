import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
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
});
