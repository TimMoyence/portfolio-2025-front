import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { of } from "rxjs";
import { AUTH_PORT } from "../../core/ports/auth.port";
import { createAuthPortStub } from "../../../testing/factories/auth.factory";
import { ResetPasswordComponent } from "./reset-password.component";

describe("ResetPasswordComponent", () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: ReturnType<typeof createAuthPortStub>;

  beforeEach(async () => {
    authService = createAuthPortStub();

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_PORT, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ token: "raw-token" }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it("soumet le reset quand le token est present et le formulaire valide", () => {
    authService.resetPassword.and.returnValue(
      of({ message: "Mot de passe reinitialise avec succes." }),
    );

    component.newPassword = "NewPassword123!";
    component.confirmPassword = "NewPassword123!";

    component.submit({
      invalid: false,
      resetForm: jasmine.createSpy("resetForm"),
    } as never);

    expect(authService.resetPassword).toHaveBeenCalledWith({
      token: "raw-token",
      newPassword: "NewPassword123!",
    });
    expect(component.successMessage).toContain("reinitialise");
  });
});
