export interface AppConfig {
  production: boolean;
  appName: string;
  apiBaseUrl: string;
  baseUrl: string;
  googleClientId?: string;
  external: {
    sebastianUrl: string;
  };
  gdpr?: {
    regionScope: "EU_UK";
    policyVersion: string;
    cookieMaxAgeDays: number;
    termsVersion: string;
  };
}
