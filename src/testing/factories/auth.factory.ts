import { of } from "rxjs";
import type { AuthUser } from "../../app/core/models/auth.model";
import type { AuthPort } from "../../app/core/ports/auth.port";

/**
 * Construit un objet AuthUser avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildAuthUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: "user-1",
    email: "test@example.com",
    firstName: "Jean",
    lastName: "Dupont",
    phone: null,
    isActive: true,
    roles: ["weather"],
    ...overrides,
  };
}

/**
 * Cree un stub complet du port auth avec des spies Jasmine.
 * Les spies retournent of(null) par defaut pour eviter les erreurs
 * de subscribe dans AuthStateService.restoreSession().
 */
export function createAuthPortStub(): Record<keyof AuthPort, jasmine.Spy> {
  return {
    login: jasmine.createSpy("login").and.returnValue(of(null)),
    register: jasmine.createSpy("register").and.returnValue(of(null)),
    me: jasmine.createSpy("me").and.returnValue(of(null)),
    googleAuth: jasmine.createSpy("googleAuth").and.returnValue(of(null)),
  };
}
