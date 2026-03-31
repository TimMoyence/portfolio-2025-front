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
import { createAuthPortStub } from "../../../testing/factories/auth.factory";
import { SebastianComponent } from "./sebastian.component";

describe("SebastianComponent", () => {
  let component: SebastianComponent;
  let fixture: ComponentFixture<SebastianComponent>;
  let authPortStub: ReturnType<typeof createAuthPortStub>;

  beforeEach(async () => {
    authPortStub = createAuthPortStub();

    // Configuration par defaut des stubs pour eviter les erreurs de subscribe
    authPortStub.login.and.returnValue(of(null));
    authPortStub.register.and.returnValue(of(null));
    authPortStub.me.and.returnValue(of(null));
    authPortStub.googleAuth.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [SebastianComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AUTH_PORT, useValue: authPortStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SebastianComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("devrait se creer", () => {
    expect(component).toBeTruthy();
  });
});
