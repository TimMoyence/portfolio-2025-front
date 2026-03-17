import { InjectionToken } from "@angular/core";
import type { AppConfig } from "./app-config.model";

export const APP_CONFIG = new InjectionToken<AppConfig>("APP_CONFIG");
