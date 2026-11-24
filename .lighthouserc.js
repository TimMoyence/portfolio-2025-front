/** @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node dist/portfolio-app/server/fr/server.mjs',
      startServerReadyPattern: 'Node Express server listening on',
      url: ['http://localhost:4000/'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'uses-responsive-images': ['error', { maxLength: 0 }],
        'color-contrast': ['error', { minScore: 1 }],
        'uses-text-compression': ['error', { maxLength: 0 }],
        'categories:performance': ['warn', { minScore: 0.8 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci/rapports',
    },
  },
};
