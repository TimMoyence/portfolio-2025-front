import { defineConfig, devices } from '@playwright/test';

const SPECS_VISUELS = '**/visual-regression.spec.ts';

const baseSsr = process.env['SSR_BASE_URL'];

const baseSsrAnglais = process.env['SSR_EN_BASE_URL'];

const serveurAngular = {
  command: 'npm run start',
  url: 'http://localhost:4200',
  reuseExistingServer: !process.env['CI'],
  timeout: 180_000,
};

const serveurDeLocale = (commande: string, base: string | undefined) =>
  base === undefined || base === ''
    ? []
    : [
        {
          command: commande,
          url: `${base}/sitemap.xml`,
          reuseExistingServer: !process.env['CI'],
          timeout: 180_000,
        },
      ];

const serveurSsr = [
  ...serveurDeLocale('npm run serve:ssr:portfolio-app', baseSsr),
  ...serveurDeLocale('npm run serve:ssr:portfolio-app:en', baseSsrAnglais),
];

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['github'], ['line']] : 'html',
  snapshotPathTemplate: 'e2e/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: SPECS_VISUELS,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visuel',
      testMatch: SPECS_VISUELS,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [serveurAngular, ...serveurSsr],
});
