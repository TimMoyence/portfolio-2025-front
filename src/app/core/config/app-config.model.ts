export interface AppConfig {
  production: boolean;
  appName: string;
  apiBaseUrl: string;
  baseUrl: string;
  external: {
    presqUrl: string;
    sebastianUrl: string;
  };
  gdpr?: {
    regionScope: "EU_UK";
    policyVersion: string;
    cookieMaxAgeDays: number;
    termsVersion: string;
  };
}
