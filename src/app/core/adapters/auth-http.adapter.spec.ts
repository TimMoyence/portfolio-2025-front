import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environnement';
import { APP_CONFIG } from '../config/app-config.token';
import { AuthSession, AuthUser, LoginCredentials, RegisterUserPayload } from '../models/auth.model';
import { AuthHttpAdapter } from './auth-http.adapter';

describe('AuthHttpAdapter', () => {
  let adapter: AuthHttpAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthHttpAdapter,
        {
          provide: APP_CONFIG,
          useValue: environment,
        },
      ],
    });

    adapter = TestBed.inject(AuthHttpAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST credentials to the login endpoint', () => {
    const credentials: LoginCredentials = {
      email: 'john@example.com',
      password: 'Password123!',
    };
    const response: AuthSession = {
      accessToken: 'token',
      expiresIn: 3600,
      user: {
        id: 'id',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        isActive: true,
      },
    };

    adapter.login(credentials).subscribe((session) => {
      expect(session).toEqual(response);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(response);
  });

  it('should POST payload to the register endpoint', () => {
    const payload: RegisterUserPayload = {
      email: 'john@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33123456789',
    };

    const user: AuthUser = {
      id: 'generated-id',
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone ?? null,
      isActive: true,
    };

    adapter.register(payload).subscribe((createdUser) => {
      expect(createdUser).toEqual(user);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(user);
  });
});
