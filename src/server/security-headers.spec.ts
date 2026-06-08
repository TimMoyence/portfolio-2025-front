import { buildSecurityHeaders } from "./security-headers";

describe("security-headers", () => {
  describe("buildSecurityHeaders", () => {
    it("pose X-Frame-Options: SAMEORIGIN", () => {
      const headers = buildSecurityHeaders({ isHttps: false });
      expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    });

    it("pose Referrer-Policy: strict-origin-when-cross-origin", () => {
      const headers = buildSecurityHeaders({ isHttps: false });
      expect(headers["Referrer-Policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
    });

    it("pose une Permissions-Policy restrictive", () => {
      const headers = buildSecurityHeaders({ isHttps: false });
      expect(headers["Permissions-Policy"]).toBe(
        "camera=(), microphone=(), geolocation=(self)",
      );
    });

    it("pose une CSP en mode Report-Only contenant frame-ancestors 'self'", () => {
      const headers = buildSecurityHeaders({ isHttps: false });
      expect(headers["Content-Security-Policy-Report-Only"]).toContain(
        "frame-ancestors 'self'",
      );
    });

    it("n'emet PAS de CSP en mode enforce (Content-Security-Policy absent)", () => {
      const headers = buildSecurityHeaders({ isHttps: true });
      expect(headers["Content-Security-Policy"]).toBeUndefined();
    });

    it("OMET HSTS si la requete n'est pas en HTTPS", () => {
      const headers = buildSecurityHeaders({ isHttps: false });
      expect(headers["Strict-Transport-Security"]).toBeUndefined();
    });

    it("INCLUT HSTS si la requete est en HTTPS", () => {
      const headers = buildSecurityHeaders({ isHttps: true });
      expect(headers["Strict-Transport-Security"]).toBe(
        "max-age=63072000; includeSubDomains",
      );
    });

    it("autorise les origines externes reellement chargees dans la CSP", () => {
      const csp = buildSecurityHeaders({ isHttps: true })[
        "Content-Security-Policy-Report-Only"
      ];
      expect(csp).toContain("https://plausible.io");
      expect(csp).toContain("https://accounts.google.com");
      expect(csp).toContain("https://nominatim.openstreetmap.org");
      expect(csp).toContain("https://api.rainviewer.com");
    });
  });
});
