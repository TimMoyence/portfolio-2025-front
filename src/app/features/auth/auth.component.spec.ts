import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { of } from 'rxjs';
import { AuthSession } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'register',
      'login',
    ]);

    await TestBed.configureTestingModule({
      imports: [FormsModule, AuthComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const buildForm = (invalid: boolean): NgForm =>
    ({
      invalid,
      resetForm: jasmine.createSpy('resetForm'),
    } as unknown as NgForm);

  it('should call the auth service when sign up form is valid and passwords match', () => {
    const form = buildForm(false);
    component.signupForm = {
      email: 'john@example.com',
      password: 'Password123!',
      verifPassword: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '  +33 6 12 34 56 78  ',
    };
    authService.register.and.returnValue(
      of({
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33 6 12 34 56 78',
        isActive: true,
      }),
    );

    component.handleSignupSubmit(form);

    expect(authService.register).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33 6 12 34 56 78',
    });
    expect(component.signupSuccessMessage).toContain('Compte créé');
  });

  it('should not call auth service when passwords do not match', () => {
    const form = buildForm(false);
    component.signupForm = {
      email: 'john@example.com',
      password: 'Password123!',
      verifPassword: 'Password456!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '',
    };

    component.handleSignupSubmit(form);

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.signupErrorMessage).toBeDefined();
  });

  it('should call auth service login when form is valid', () => {
    const form = buildForm(false);
    component.loginForm = {
      email: 'john@example.com',
      password: 'Password123!',
    };
    const session: AuthSession = {
      accessToken: 'token',
      expiresIn: 3600,
      user: {
        id: '1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        isActive: true,
      },
    };
    authService.login.and.returnValue(of(session));

    component.handleLoginSubmit(form);

    expect(authService.login).toHaveBeenCalledWith(component.loginForm);
    expect(component.loginSuccessMessage).toContain('Bienvenue');
  });
});
