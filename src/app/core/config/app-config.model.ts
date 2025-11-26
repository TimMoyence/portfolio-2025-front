export interface AppConfig {
  production: boolean;
  appName: string;
  apiBaseUrl: string;
  external: {
    presqUrl: string;
    sebastianUrl: string;
  };
}
