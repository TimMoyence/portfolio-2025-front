/// <reference types="@angular/localize" />

import { bootstrapApplication } from "@angular/platform-browser";
import { register as registerSwiperElements } from "swiper/element/bundle";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

// Enregistre les custom elements Swiper (`<swiper-container>`, `<swiper-slide>`)
// au bootstrap browser. Idempotent cote runtime, no-op cote serveur (ce
// fichier n'est jamais charge par le bundle SSR — voir `main.server.ts`).
if (typeof window !== "undefined") {
  registerSwiperElements();
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
