const path = require("node:path");

module.exports = function configureKarma(config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
    ],
    client: {
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: path.join(__dirname, "coverage/portfolio-app"),
      subdir: ".",
      reporters: [
        { type: "html" },
        { type: "lcovonly" },
        { type: "text-summary" },
      ],
      check: {
        global: {
          statements: 60,
          branches: 40,
          functions: 56,
          lines: 61,
        },
      },
    },
    reporters: ["progress", "kjhtml"],
    browsers: ["Chrome"],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: "ChromeHeadless",
        flags: [
          "--no-sandbox",
          "--headless",
          "--disable-gpu",
          "--disable-dev-shm-usage",
        ],
      },
    },
    restartOnFileChange: true,
  });
};
