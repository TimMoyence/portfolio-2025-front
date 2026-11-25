const { join } = require('node:path');

const SILENCE_TOLERE_MS = 60_000;

const RELAIS_DE_CHROME = join(__dirname, 'scripts/tests/chrome-sans-tubes.sh');

const { DEFAULT_CMD } = require('karma-chrome-launcher')['launcher:ChromeHeadless'][1].prototype;

module.exports = function configureKarma(config) {
  process.env['CHROME_REEL'] ??= process.env['CHROME_BIN'] ?? DEFAULT_CMD[process.platform] ?? '';
  process.env['CHROME_BIN'] = RELAIS_DE_CHROME;
  config.set({
    basePath: '',
    browserNoActivityTimeout: SILENCE_TOLERE_MS,
    browserDisconnectTimeout: SILENCE_TOLERE_MS,
    pingTimeout: SILENCE_TOLERE_MS,
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      clearContext: false,
      tranche: process.env['KARMA_TRANCHE'],
      jasmine: { random: true, seed: process.env['KARMA_GRAINE'] },
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: process.env['KARMA_COUVERTURE'],
      subdir: '.',
      reporters: [{ type: 'json' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--headless',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
        ],
      },
    },
    restartOnFileChange: true,
  });
};
