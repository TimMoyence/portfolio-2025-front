import { authGuard } from "./core/guards/auth.guard";
import { routes } from "./app.routes";

describe("app routes", () => {
  it("contains forgot-password and reset-password routes", () => {
    expect(routes.some((route) => route.path === "forgot-password")).toBeTrue();
    expect(routes.some((route) => route.path === "reset-password")).toBeTrue();
  });

  it("protects /profil with authGuard", () => {
    const profileRoute = routes.find((route) => route.path === "profil");

    expect(profileRoute).toBeDefined();
    expect(profileRoute?.canActivate).toBeDefined();
    expect(profileRoute?.canActivate?.includes(authGuard)).toBeTrue();
  });
});
