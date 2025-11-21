import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthSession, AuthUser, LoginCredentials, RegisterUserPayload } from '../models/auth.model';
import { AUTH_PORT, AuthPort } from '../ports/auth.port';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let authPortSpy: jasmine.SpyObj<AuthPort>;

  beforeEach(() => {
    authPortSpy = jasmine.createSpyObj<AuthPort>('AuthPort', ['login', 'register']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: AUTH_PORT,
          useValue: authPortSpy,
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should delegate login to the auth port', () => {
    const credentials: LoginCredentials = {
      email: 'john@example.com',
      password: 'Password123!',
    };
    const session: AuthSession = {
      accessToken: 'token',
      expiresIn: 3600,
      user: {
        id: '1',
        email: credentials.email,
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        isActive: true,
      },
    };

    authPortSpy.login.and.returnValue(of(session));

    service.login(credentials).subscribe((result) => {
      expect(result).toEqual(session);
    });

    expect(authPortSpy.login).toHaveBeenCalledWith(credentials);
  });

  it('should delegate register to the auth port', () => {
    const payload: RegisterUserPayload = {
      email: 'john@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };
    const createdUser: AuthUser = {
      id: '1',
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: null,
      isActive: true,
    };

    authPortSpy.register.and.returnValue(of(createdUser));

    service.register(payload).subscribe((result) => {
      expect(result).toEqual(createdUser);
    });

    expect(authPortSpy.register).toHaveBeenCalledWith(payload);
  });
});
