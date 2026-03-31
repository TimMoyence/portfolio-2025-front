# Rapport d'exploration — App Meteo Interactive

## 1. Analyse des apps de reference

### Apple Weather

**Forces principales :**

- **Design minimaliste a couches** : Divulgation progressive (progressive disclosure). Couche 1 = conditions actuelles avec animation plein ecran. Couche 2 = previsions horaires groupees. Couche 3 = analyses detaillees (UV, humidite, pression, qualite de l'air).
- **Animations meteo immersives** : Ciel anime (pluie, nuages, soleil, neige) — comprehension instantanee sans lire.
- **Hierarchie visuelle forte** : Principe de Gestalt de "region commune" (boites grises contenant des informations liees). Scan rapide. Conteneurs adoptant le schema de couleurs du fond.
- **"Feels Like" contextuel (iOS 18)** : Temperature ressentie n'apparait que quand elle differe significativement de la reelle.
- **Panneau vent redesigne** : Vitesse du vent centree dans une boussole avec directions cardinales.
- **Qualite de l'air detaillee** : Liste complete des polluants (pas seulement le principal).

**Faiblesses :**

- Pas de sources de donnees alternatives.
- Radar meteo basique.
- Personnalisation limitee.
- Pas de notifications granulaires de precipitation.

---

### CARROT Weather

**Forces principales :**

- **Personnalite unique** : 5 niveaux (professionnel, amical, sarcastique, homicide, excessif). Seule app a avoir un "caractere".
- **Personnalisation extreme** : Ecran Layout pour construire l'app, reordonner les modules, choisir les donnees.
- **Sources de donnees multiples** : Foreca, Apple Weather, AccuWeather, Tomorrow.io, OpenWeather, Xweather.
- **Reconnaissances** : App of the Year Apple, Apple Design Award.

**Ce qui la rend unique :** L'humour comme differenciateur. Prouve qu'une app utilitaire peut creer un attachement emotionnel.

---

### Windy (windy.com)

**Forces principales :**

- **Visualisation animee plein ecran** : Carte animee en temps reel des vents, nuages, precipitations, pression.
- **Modeles meteorologiques multiples** : ECMWF, GFS, ICON, NEMS, AROME, UKV, ICON-D2.
- **51 couches de donnees** : Vents, precipitation, temperature, pression, humidite, couverture nuageuse, vagues, neige.
- **55 000 webcams meteo** integrees a la carte.
- **Gratuit et sans pub**.

**Ce qui la rend unique :** Le "Google Earth de la meteo". Meilleure app pour comprendre visuellement les phenomenes atmospheriques.

---

### yr.no

**Forces principales :**

- **Fiabilite scandinave** : NRK + Institut meteorologique de Norvege. Precision reconnue en Europe du Nord.
- **Design epure et accessible** : Focus lisibilite et accessibilite (contrastes travailles).
- **Open source** : Carte basee sur Maplibre/OpenStreetMap. API developpeur ouverte.
- **Gratuit et sans pub** : Service public.

**Ce qui la rend unique :** L'archetype de l'app meteo "service public" — fiable, accessible, respectueuse de la vie privee.

---

### Weather Underground

**Forces principales :**

- **Reseau de 270 000+ stations personnelles** : Donnees hyperlocales crowdsourcees.
- **WunderMap interactive** : Radar Nexrad, satellite NOAA, stations PWS, chaleur, precipitation cumulee.
- **Smart Forecasts (Premium)** : Conditions ideales pour activites outdoor.
- **Integration IFTTT** : Automatisation basee sur les conditions meteo.

**Ce qui la rend unique :** Le pouvoir de la communaute. Meilleur exemple de meteo collaborative.

---

## 2. Design et tendances visuelles

### Liquid Glass (iOS 26)

Annonce WWDC 9 juin 2025. Nouveau langage de design unifie pour tout l'ecosysteme Apple.

**Definition :** Un "meta-materiau numerique" translucide qui reflechit et refracte son environnement de maniere dynamique. Contrairement au glassmorphisme classique qui disperse la lumiere (flou), le Liquid Glass **plie** la lumiere (lensing), creant des surfaces gel qui revelent le contenu en dessous de facon deformee.

**Trois couches techniques :**

1. **Highlight** : Projection et mouvement de la lumiere (reflets speculaires reagissant au mouvement).
2. **Shadow** : Separation en profondeur (ombres adaptatives).
3. **Illumination** : Proprietes materielles flexibles (teinte, opacite, brillance).

**Comportements cles :**

- Barres d'onglets qui retrecissent au scroll et se re-expansent fluidement.
- Adaptation automatique light/dark mode.
- Animations de "shape-shifting" similaires a Dynamic Island.
- Deux variantes : **regular** (adaptative) et **clear** (non-adaptative).

### Glassmorphisme

**Les 4 piliers CSS :**

1. `backdrop-filter: blur(10px)` — Le coeur de l'effet
2. `background: rgba(255, 255, 255, 0.15)` — Translucidite semi-transparente
3. `border: 1px solid rgba(255, 255, 255, 0.3)` — Bordure lumineuse
4. `box-shadow` — Profondeur et elevation

### Techniques CSS cles

**Glassmorphisme de base :**

```css
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.2);
}
```

**Liquid Glass avance (pseudo-elements) :**

```css
.liquid-glass {
  position: relative;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(2px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 2rem;
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.2),
    inset 0 4px 20px rgba(255, 255, 255, 0.3);
}
```

**Avec Tailwind CSS :**

```html
<div
  class="bg-white/15 backdrop-blur-md border border-white/30
            rounded-2xl shadow-lg"
></div>
```

**Accessibilite :**

- Contraste minimum WCAG 2.2 : 4.5:1 texte, 3:1 composants UI
- Overlays semi-opaques derriere le texte
- Respecter `prefers-reduced-transparency` et `prefers-reduced-motion`
- Eviter le glass-on-glass (empilement de couches transparentes)

**Performance :**

- Limiter le blur a 8-15px
- Maximum 3-5 elements avec backdrop-filter sur mobile
- `will-change: backdrop-filter` avant animations
- `transform: translateZ(0)` pour GPU

---

## 3. APIs meteo disponibles

| Critere              | **Open-Meteo**                                 | **OpenWeatherMap**       | **Visual Crossing**       | **WeatherAPI.com** |
| -------------------- | ---------------------------------------------- | ------------------------ | ------------------------- | ------------------ |
| **Prix**             | Gratuit (non-commercial)                       | Gratuit (1 000 appels/j) | Gratuit (1 000 records/j) | Gratuit (limite)   |
| **Cle API**          | Non requise                                    | Oui                      | Oui                       | Oui                |
| **Prevision**        | 16 jours                                       | 5 jours (gratuit)        | 15 jours                  | 14 jours           |
| **Historique**       | 80+ ans (depuis 1940)                          | Limite                   | Depuis 1970+              | Depuis 2010        |
| **Qualite de l'air** | Oui                                            | Oui                      | Non                       | Oui                |
| **Marine**           | Oui                                            | Non                      | Oui                       | Oui                |
| **Modeles meteo**    | ECMWF, GFS, HRRR, ICON, GEM                    | Propres                  | Multisources              | Propres            |
| **Open Source**      | Oui (AGPLv3)                                   | Non                      | Non                       | Non                |
| **Donnees uniques**  | Ensemble API, Climate Change, Flood, Elevation | Tuiles carte meteo       | Growing degree days       | Sports, Astronomie |

### Recommandation : Open-Meteo

1. **Zero friction** : pas de cle, pas d'inscription
2. **Richesse** : temperature, vent, humidite, horaire 16j, historique 80 ans, AQI, marine, inondations, elevation, geocoding
3. **Modeles multiples** : ECMWF, GFS, ICON — comparaisons pour le mode expert
4. **Open source et transparent**
5. **Gratuit non-commercial** : parfait pour un portfolio

---

## 4. Fonctionnalites par niveau utilisateur

### Debutant

_Comprendre la meteo du jour en 3 secondes._

| Fonctionnalite                   | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| Temperature actuelle + ressentie | Grand affichage, difference expliquee simplement      |
| Animation meteo                  | Ciel anime — comprehension intuitive sans lire        |
| Prevision jour                   | Max/min avec icones simples                           |
| Prevision semaine                | 7 jours avec barres min/max visuelles                 |
| "Faut-il un parapluie ?"         | Indicateur binaire avec jauge visuelle                |
| Indice vestimentaire             | Suggestion de tenue basee sur les conditions          |
| Tooltips educatifs               | Icones (?) expliquant chaque donnee en langage simple |

### Intermediaire

_Planifier ses activites avec precision._

| Fonctionnalite           | Description                                        |
| ------------------------ | -------------------------------------------------- |
| Prevision horaire        | Graphique scrollable 24-48h                        |
| Indice UV                | Echelle coloree avec recommandations               |
| Qualite de l'air (AQI)   | Indice global + polluants, code couleur            |
| Radar de precipitation   | Carte animee deplacement pluies 1-2h               |
| Pression atmospherique   | Tendance + explication ("baisse = temps instable") |
| Lever/coucher du soleil  | Arc visuel avec position actuelle, duree du jour   |
| Phases de la lune        | Calendrier lunaire avec illumination               |
| Comparaison multi-villes | Swipe entre villes (comme Apple Weather)           |

### Expert / Meteorologue

_Analyser les donnees brutes et comprendre les phenomenes._

| Fonctionnalite             | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| Modeles meteo multiples    | Comparaison ECMWF vs GFS vs ICON                            |
| Sondage atmospherique      | Profil vertical temperature/humidite (SkewT-LogP simplifie) |
| Cartes isobariques         | Lignes de pression + fronts                                 |
| Rose des vents             | Distribution directionnelle sur une periode                 |
| Spaghetti plots            | Trajectoires multiples — visualisation de l'incertitude     |
| Point de rosee             | Relation humidite/confort expliquee                         |
| CAPE/CIN                   | Indices d'instabilite convective (risque orageux)           |
| Historique climatologique  | Normales saisonnieres, records, anomalies                   |
| Donnees brutes exportables | Export CSV/JSON                                             |
| Mode "Explique-moi"        | Panneau pedagogique interactif pour chaque metrique         |

### Pattern UX : Progressive Disclosure

- **Couche 1 (visible)** : Conditions actuelles, animation, prevision jour
- **Couche 2 (scroll)** : UV, AQI, pression, vent detaille
- **Couche 3 (tap/expand)** : Donnees expert, graphiques detailles, comparaison modeles
- **Couche 4 (parametres)** : Mode "Expert" activable, metriques avancees par defaut

---

## 5. Recommandations pour notre app

### Stack technique

| Composant        | Choix                                     | Justification                            |
| ---------------- | ----------------------------------------- | ---------------------------------------- |
| Framework        | Angular 19 (existant)                     | Coherence portfolio, SSR configure       |
| API meteo        | Open-Meteo (principale)                   | Gratuit, sans cle, riche, open source    |
| API geocoding    | Open-Meteo Geocoding                      | Inclus gratuitement                      |
| Graphiques       | ngx-charts (D3.js)                        | Natif Angular, SSR-compatible, SVG anime |
| Cartes           | Leaflet + OpenStreetMap                   | Open source, leger, lazy loading         |
| Animations meteo | CSS animations + SVG animes               | Performant, pas de dependance lourde     |
| Styling          | SCSS + Tailwind CSS (existant)            | backdrop-blur-_, bg-white/_ natifs       |
| Icones meteo     | Weather Icons (Erik Flowers) ou Meteocons | Open source dedies meteo                 |

### Fonctionnalites prioritaires

**Phase 1 — MVP :**

1. Geolocalisation + recherche de ville (geocoding Open-Meteo)
2. Conditions actuelles : temperature, ressentie, icone/animation, description
3. Prevision horaire (24h) graphique scrollable
4. Prevision 7 jours avec barres min/max
5. Design glassmorphisme avec fond anime selon meteo

**Phase 2 — Enrichissement :** 6. Modules detailles : UV, AQI, vent (boussole), pression, humidite, lever/coucher soleil 7. Tooltips educatifs (mode debutant) 8. Multi-villes avec favoris 9. Responsive + PWA-ready

**Phase 3 — Expert :** 10. Comparaison de modeles meteo (ECMWF vs GFS) 11. Historique climatologique (Open-Meteo Historical API) 12. Radar de precipitation 13. Mode expert avec metriques avancees 14. Micro-animations et transitions Liquid Glass

### Approche design

1. **Fond dynamique anime** : Gradient + animations CSS selon conditions (particules pluie, rayons soleil, flocons)
2. **Cartes glassmorphiques** : `rgba(255,255,255,0.12)`, blur 12px, bordure subtile blanche
3. **Typographie sobre** : System fonts (SF Pro / Inter) en blanc, text-shadow leger. Temperature en 48-64px
4. **Code couleur semantique** : UV (vert > violet), AQI (vert > rouge), temperature (bleu > orange)
5. **Animations subtiles** : Transitions douces, micro-interactions, respecter `prefers-reduced-motion`
6. **Dark-first design** : Le glassmorphisme rend mieux sur fond sombre

---

## 6. Comment realiser les mockups Apple-like

### Methode detaillee

**Etape 1 — References visuelles (1-2h)**

- Capturer des screenshots d'Apple Weather (soleil, pluie, nuit, neige)
- Templates Figma Community :
  - "Weather App - Glassmorphism Design Style"
  - "Glassmorphic UI Kit for iOS 26"
  - "iPhone 14 Pro Weather app Glassmorphism"
- Mood board captures + inspirations Dribbble/Behance

**Etape 2 — Structure Figma (2-3h)**

- Frame iPhone 15 Pro (393x852)
- Grille : fond plein ecran + zone scrollable de cartes
- Elements par couches :
  - Fond : gradient + illustration meteo
  - Header : ville, temperature, condition, min/max
  - Scroll zone : prevision horaire, 7 jours, modules
  - Chaque module = rectangle arrondi glassmorphique :
    - Fill : blanc 12% opacite
    - Background Blur : 40px Figma (~12px CSS)
    - Bordure : blanc 30%, 1px
    - Ombre : noir 10%, Y:8, blur:32

**Etape 3 — Composants (2-3h)**

- **WeatherCard** : conteneur generique avec titre + contenu
- **HourlyForecast** : scroll horizontal, icone + temp par heure
- **DailyForecast** : ligne par jour, icone, min, max, barre de plage
- **WindCompass** : boussole SVG avec fleche directionnelle
- **UVIndex** : barre graduee coloree
- **SunArc** : arc de cercle representant la course du soleil

**Etape 4 — Version desktop (1-2h)**

- Layout grille 2-3 colonnes pour les modules
- Fond toujours plein ecran
- Sidebar optionnelle pour les villes

**Etape 5 — Prototype interactif (1-2h)**

- Scroll vertical, tap pour agrandir, swipe pour changer de ville
- Exporter en prototype Figma partage

**Alternative rapide :** Coder directement en Angular + Tailwind. Les classes `backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-lg` produisent immediatement un rendu glassmorphique convaincant. Iterer dans le navigateur peut etre plus rapide que Figma.

---

## 7. Prompt de reprise pour demain

```
Tu es un developpeur Angular 19 senior travaillant sur une app meteo interactive
pour un portfolio. Voici le contexte :

## Architecture existante
- Angular 19 SSR, standalone components, ports/adapters pattern
- SCSS + Tailwind CSS (design tokens dans tailwind.config.js)
- i18n FR/EN avec XLF
- Le projet est dans portfolio-2025-front/
- Auth en place : authGuard + roleGuard('weather') pour proteger la route

## Decisions prises
- API : Open-Meteo (gratuit, sans cle, REST/JSON)
  - Weather Forecast API : https://api.open-meteo.com/v1/forecast
  - Geocoding API : https://geocoding-api.open-meteo.com/v1/search
  - Historical API : https://archive-api.open-meteo.com/v1/archive
  - Air Quality API : https://air-quality-api.open-meteo.com/v1/air-quality
- Backend .NET existant dans WeatherApp/ (DDD : Domain, Application, Infrastructure, Api)
  — a connecter comme API intermediaire si necessaire
- Graphiques : ngx-charts (wrapper D3 natif Angular, SSR-compatible)
- Design : Glassmorphisme Apple-like (dark-first)
  - Fond anime selon conditions meteo
  - Cartes translucides : bg rgba(255,255,255,0.12), backdrop-blur 12px,
    border rgba(255,255,255,0.3), border-radius 1rem
  - Tailwind : backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-lg
- UX : Progressive disclosure (3 niveaux : debutant/intermediaire/expert)

## Phase 1 MVP a implementer
1. Service Open-Meteo (port + adapter pattern) pour :
   - Geocoding (recherche de villes)
   - Conditions actuelles (temperature, vent, humidite, conditions)
   - Previsions horaires 24h
   - Previsions 7 jours
2. Composant WeatherDashboard (page principale) avec :
   - Fond anime CSS selon conditions meteo (gradient + particules)
   - Header : ville, temperature actuelle, ressentie, condition
   - HourlyForecast : scroll horizontal avec graphique ngx-charts
   - DailyForecast : 7 jours, barres min/max
3. Composant CitySearch : recherche avec geocoding, favoris localStorage
4. Responsive mobile-first, glassmorphisme sur tous les modules
5. SSR-safe : guards pour window/document/localStorage
6. Route /weather protegee par canActivate: [authGuard, roleGuard('weather')]

## Rapport d'exploration
Le rapport complet est dans docs/specs/2026-03-30-weather-app-exploration.md
Il contient l'analyse de 5 apps de reference, les techniques CSS, les APIs
comparees, les fonctionnalites par niveau, et l'approche design.

## Conventions du projet
- TDD : ecrire les tests en premier
- Conventional Commits en francais
- JSDoc sur les exports
- Pas de logique metier dans les composants (use cases dans core/)
- Port = interface, Adapter = implementation HTTP
- OnPush change detection sur tous les composants
- SSR-safe : isPlatformBrowser avant window/document/localStorage

## Fichiers de reference
- CLAUDE.md a la racine du workspace parent
- Le rapport d'exploration : docs/specs/2026-03-30-weather-app-exploration.md

Commence par lire le rapport d'exploration, puis implemente la Phase 1
avec le brainstorming skill pour definir les mockups avant de coder.
```

---

## Sources

- [Apple Weather iOS 18 - 9to5Mac](https://9to5mac.com/2024/07/03/apples-weather-app-gets-two-new-features-in-ios-18/)
- [Apple Liquid Glass - Apple Newsroom](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- [Liquid Glass - Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass)
- [Apple Weather Design - Olivia Penn](https://olivia-penn.framer.ai/apple-weather-app)
- [CARROT Weather](https://www.meetcarrot.com/weather/)
- [Windy.com](https://www.windy.com)
- [yr.no](https://www.yr.no/en)
- [Weather Underground](https://www.wunderground.com/download)
- [Liquid Glass CSS - CSS-Tricks](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [Liquid Glass CSS - DEV](https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl)
- [Glassmorphism Accessibility - Axess Lab](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/)
- [Dark Glassmorphism 2026 - Medium](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [Open-Meteo](https://open-meteo.com/)
- [Open-Meteo GitHub](https://github.com/open-meteo/open-meteo)
- [Best Weather API 2025 - Visual Crossing](https://www.visualcrossing.com/resources/blog/best-weather-api-for-2025/)
- [ngx-charts for Angular](https://github.com/swimlane/ngx-charts)
- [Weather App Glassmorphism (Figma)](https://www.figma.com/community/file/1301388667663240529/weather-app-glassmorphism-design-style)
- [Glassmorphic UI Kit iOS 26 (Figma)](https://www.figma.com/community/file/1514159272233131504/glassmorphic-ui-kit-for-ios-26)
