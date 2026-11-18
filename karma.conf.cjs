const path = require('node:path');

const SILENCE_TOLERE_MS = 60_000;

const couvertureDeLaTranche = process.env['KARMA_COUVERTURE'];

module.exports = function configureKarma(config) {
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
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter:
      couvertureDeLaTranche === undefined
        ? {
            dir: path.join(__dirname, 'coverage/portfolio-app'),
            subdir: '.',
            reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'text-summary' }],
          }
        : { dir: couvertureDeLaTranche, subdir: '.', reporters: [{ type: 'json' }] },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
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
