import { of, throwError } from "rxjs";
import type { LeadMagnetPort } from "../../app/core/ports/lead-magnet.port";

/** Cree un stub du port lead magnet avec une reponse succes par defaut. */
export function createLeadMagnetPortStub(): jasmine.SpyObj<LeadMagnetPort> {
  const stub = jasmine.createSpyObj<LeadMagnetPort>("LeadMagnetPort", [
    "requestToolkit",
  ]);
  stub.requestToolkit.and.returnValue(
    of({
      message: "Votre boite a outils a ete envoyee a test@example.com",
      httpCode: 200,
    }),
  );
  return stub;
}

/** Cree un stub du port lead magnet qui retourne une erreur. */
export function createLeadMagnetPortStubWithError(): jasmine.SpyObj<LeadMagnetPort> {
  const stub = jasmine.createSpyObj<LeadMagnetPort>("LeadMagnetPort", [
    "requestToolkit",
  ]);
  stub.requestToolkit.and.returnValue(
    throwError(() => new Error("Network error")),
  );
  return stub;
}
