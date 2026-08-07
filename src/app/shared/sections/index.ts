// shared/sections/index.ts
//
// Barrel public de la bibliotheque de composants de section marketing Asili
// (Lot 3a). Chaque composant est standalone, OnPush et SSR-safe ; le texte
// arrive via inputs ou projection (l'i18n est delegue aux pages appelantes).
// Les pages des lots suivants composent ces sections en important depuis ce
// barrel plutot que les fichiers individuels.

// Hero
export { AsiliHeroComponent } from './asili-hero/asili-hero.component';

// Methode (4 etapes)
export { AsiliMethodComponent, type AsiliMethodStep } from './asili-method/asili-method.component';

// Piliers (services / formations)
export {
  AsiliPillarsComponent,
  type AsiliPillar,
  type AsiliPillarLink,
  type AsiliPillarVariant,
} from './asili-pillars/asili-pillars.component';

// Bande CTA
export { AsiliCtaBandComponent } from './asili-cta-band/asili-cta-band.component';

// Grille de projets
export {
  AsiliProjectsGridComponent,
  type AsiliProject,
  type AsiliProjectSize,
  type AsiliProjectTag,
} from './asili-projects-grid/asili-projects-grid.component';

// Manifeste (scrollytelling)
export {
  AsiliManifestoComponent,
  type AsiliManifestoLine,
} from './asili-manifesto/asili-manifesto.component';

// Methode IA (theme night)
export {
  AsiliAiMethodComponent,
  type AsiliAiMethodStep,
} from './asili-ai-method/asili-ai-method.component';
