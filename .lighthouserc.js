/**
 * Configuration Lighthouse CI pour le projet portfolio-2025-front.
 *
 * Lance le serveur SSR Angular (locale fr), exécute 3 audits desktop
 * et vérifie les seuils de performance, accessibilité, bonnes pratiques et SEO.
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "node dist/portfolio-app/server/fr/server.mjs",
      startServerReadyPattern: "Node Express server listening on",
      url: ["http://localhost:4000/"],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
