# Portfolio 2025 Frontend

Application Angular 19 du portfolio. Le frontend est SSR, localise en `fr` et `en`, et structure autour d'une separation nette entre features UI, composants partages et infrastructure.

## Stack

- Angular 19 avec standalone components
- TypeScript strict
- Angular SSR / prerender
- RxJS
- SCSS + Tailwind CSS
- Jasmine / Karma
- ESLint + Prettier

## Architecture

Le frontend est organise en trois zones principales :

- `src/app/core` : ports, adapters HTTP, interceptors, SEO, configuration et services transverses.
- `src/app/features` : pages, parcours utilisateur et orchestration d'ecrans.
- `src/app/shared` : composants reutilisables, modeles partages et directives communes.

Regle non negociable : un composant peut orchestrer de l'etat UI, mais pas embarquer de logique d'infrastructure qui doit vivre dans `core`.

## Cartographie des routes

Source de verite : [`src/app/app.routes.ts`](./src/app/app.routes.ts) (et [`src/app/app.routes.server.ts`](./src/app/app.routes.server.ts) pour les `renderMode`).

### Pages publiques

- `/` — Home (landing page)
- `/presentation` — Page a propos
- `/projets` — Realisations
- `/articles` — Articles Morning-Brief publies par l'API
- `/offer` — Page des offres
- `/contact` — Formulaire de contact
- `/growth-audit` — Audit SEO automatise
- `/atelier`, `/atelier/meteo`, `/atelier/sebastian` — Redirections permanentes vers `/projets`

### Auth

- `/login` — Connexion
- `/register` — Inscription
- `/forgot-password` — Mot de passe oublie
- `/reset-password` — Reinitialisation
- `/verify-email` — Verification d'email (lien magique)
- `/profil` — Profil utilisateur (`authGuard`, rendu client)

### Ateliers — apps (protegees auth + role)

Apps reelles non indexables, en rendu client (`RenderMode.Client`).

- `/atelier/meteo/app` — App meteo (`authGuard` + `roleGuard("weather")`)
- `/atelier/sebastian/app` — App Sebastian (`authGuard` + `roleGuard("sebastian")`) avec sous-routes : `dashboard`, `rapports`, `badges`, `historique`, `objectifs`

Le sitemap ajoute les slugs d'articles publies quand `PORTFOLIO_ARTICLE_API_URL` pointe vers le backend public (`.../api/v1/portfolio25`). Sans cette variable, il reste statique et ne publie aucune URL inventee.

### Formations

- `/formations` — Liste des formations
- `/formations/ia-solopreneurs` — Formation IA Solopreneurs (slides)
- `/formations/ia-solopreneurs/toolkit` — Toolkit IA Solopreneurs (capture email)
- `/formations/ia-solopreneurs/toolkit/:token` — Toolkit personnalise (acces direct via token, rendu serveur on-demand)
- `/formations/automatiser-avec-ia` — Formation Automatiser avec l'IA (slides)
- `/formations/automatiser-avec-ia/toolkit` — Toolkit Automatiser avec l'IA
- `/formations/audit-seo-diy` — Formation Audit SEO DIY (slides)
- `/formations/audit-seo-diy/toolkit` — Toolkit Audit SEO DIY

### Cours en séance

Pages non indexables (`noindex, nofollow`), en rendu client (`RenderMode.Client`). Le cours est servi par le back (`/formations/sessions/...`) : le front ne porte ni corrigé ni barème.

- `/cours/rejoindre` — Vue étudiant, sans compte : code de séance, identité, puis écrans du sujet tiré pour l'étudiant (rendu main).
- `/cours/presenter/:slug` — Pupitre du formateur (`authGuard` + `roleGuard("teacher")`) : ouverture de la séance du cours `:slug`, code à dicter, commandes, notes, résultats par question face au seuil, clôture.
- `/cours/presenter/:slug?seance=:sessionId` — Reprise du pupitre d'une séance déjà ouverte : aucune nouvelle ouverture ; le code, les résultats, le déroulé et l'écran courant sont relus. Le pupitre inscrit lui-même `?seance=` dans l'URL dès l'ouverture.
- `/cours/presenter/:slug/scene/:sessionId` — Scène pour le vidéoprojecteur (`authGuard` + `roleGuard("teacher")`) : écran courant en rendu `stage`, sans notes ni résultats, hors de la coquille du site (`data.coquille = false` : ni barre de navigation, ni pied de page, ni bandeau cookies).
- `/cours/seance/:sessionId/synthese` — Synthèse de la séance close (`authGuard`).
- `/cours/demo` — Galerie de démonstration des briques, sans séance.

### Utilitaires

- `/cookie-settings` — Parametres cookies
- `/terms` — CGU
- `/privacy` — Politique de confidentialite
- `/commonbudgetTM` — Redirection vers l'accueil `/`
- `/slides/library` — Bibliotheque de slides interne (`noindex, nofollow`)
- `/**` — 404

## Prise en main rapide

```bash
npm ci
npm run start
```

Commandes utiles :

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test:ci
npm run test:cov
npm run build
npm run ci:check
```

## Conduire une séance de cours

Matériel : un portable pour le pupitre, un écran étendu (vidéoprojecteur) pour la scène, les téléphones des étudiants. Un seul navigateur sur le portable pour le pupitre et la scène.

1. **Connexion** : se connecter sur `/login` avec le compte formateur (rôle `teacher`), puis ouvrir `/cours/presenter/<slug>` (par exemple `b1-01-proportions`). Le jeton d'accès (15 min) se renouvelle seul pendant toute la séance ; les deux fenêtres du navigateur partagent un seul renouvellement (verrou inter-onglets) et adoptent le jeton que l'autre a obtenu.
2. **Ouverture** : « Ouvrir la séance ». Le code à quatre chiffres s'affiche en grand et l'URL prend `?seance=<id>`. Ne plus cliquer sur « Ouvrir » pour cette classe : une seconde ouverture créerait une autre séance avec un autre code.
3. **Scène** : « Ouvrir la scène », glisser la fenêtre sur l'écran étendu et la passer en plein écran (F11). Une pastille discrète dans un coin indique l'état du suivi (vert : en direct ; orange : reconnexion ; rouge : refus).
4. **Inscription de la classe** : dicter le code ; les étudiants ouvrent `/cours/rejoindre` et saisissent code, prénom, nom et adresse e-mail. Tant que la séance n'est pas démarrée, leur téléphone affiche un message d'attente et aucune question n'est répondable.
5. **Contrôle de l'effectif** : comparer le compteur « Participants » du pupitre à l'effectif présent. Un écart signale une inscription en trop : clôturer et rouvrir une séance avant de démarrer.
6. **« Démarrer la séance »** : obligatoire avant la première question, rappel d'ouverture compris ; avant ce clic, le serveur refuse toute réponse.
7. **Pilotage** : « Écran suivant » / « Écran précédent », rythme libre ou piloté, lecture des résultats par question (réponses reçues, bonnes réponses, « je ne sais pas », seuil, confusions) et « Aller à la remédiation » sous le seuil. Le bandeau de statut du pupitre dit si le suivi est en direct, en reconnexion ou refusé (401/403 : se reconnecter puis recharger le pupitre ; 429 : fermer les onglets en trop).
8. **Clôture** : « Clôturer la séance », puis confirmer. Les réponses ne sont plus acceptées.
9. **Synthèse** : le pupitre ouvre `/cours/seance/<id>/synthese` (classement, résultats par question, confusions fréquentes, export CSV).

Incidents :

- **La scène se fige** (pastille orange ou rouge durable, écran en retard sur le pupitre) : recharger la fenêtre de la scène (F5). Elle relit le déroulé et reprend l'écran courant. Un flux resté muet 45 s est de toute façon relancé automatiquement.
- **Le pupitre est rechargé, fermé ou renvoyé vers la connexion** : rouvrir `/cours/presenter/<slug>?seance=<id>` (l'URL du pupitre, ou celle rendue par `returnUrl` après connexion). Le pupitre reprend la séance, son code, ses résultats et l'écran courant, sans rien rouvrir. Tant que la séance est ouverte, le navigateur demande confirmation avant de quitter la page.
- **« La vérification de votre session n'a pas abouti »** : le jeton est conservé ; vérifier le réseau, puis « Réessayer ».
- **Réponse étudiante non partie** : une panne réseau ou serveur la garde sur le téléphone et la renvoie après l'envoi suivant, à chaque changement d'état de la séance ou au retour du réseau ; un refus explicite (séance non démarrée, requête refusée) s'affiche et n'est pas mis en file.

## Hooks Git et verrous locaux

Apres `npm ci`, Husky installe automatiquement trois hooks :

- `pre-commit` : lance `lint-staged` pour formatter et lint uniquement les fichiers indexes ;
- `commit-msg` : impose un message au format Conventional Commit ;
- `pre-push` : lance `npm run pre-push:check` (lint + format:check + typecheck + test:ci, sans build) pour bloquer un push sale.

Ces hooks ne remplacent pas la CI, ils evitent surtout d'introduire une regression evidente dans l'historique local.

## Internationalisation (i18n)

Le frontend est localise `fr` (langue source) et `en`. Deux fichiers different par
format et par role :

- `src/locale/messages.xlf` — XLIFF 1.2 (`trans-unit`), source **francaise**,
  entierement regeneree par extraction : aucune edition manuelle.
- `src/locale/messages.en.xlf` — XLIFF 2.0 (`unit`/`segment`/`target`), traduction
  **anglaise**, maintenue a la main : l'extraction ne touche jamais ce fichier.

Flux a suivre a chaque ajout ou modification d'un texte marque `i18n="..."` ou
`$localize` :

1. Extraire la source francaise :

   ```bash
   npm run extract-i18n
   ```

   Cette commande regenere entierement `src/locale/messages.xlf` a partir du code
   source : elle ajoute les nouveaux `trans-unit`, retire ceux dont l'id a disparu
   et rafraichit les numeros de ligne des `context-group` existants. Ne jamais
   editer ce fichier a la main.

2. Reporter chaque `trans-unit` nouveau ou modifie dans `src/locale/messages.en.xlf`,
   en convertissant le format XLIFF 1.2 vers XLIFF 2.0 :
   - `<trans-unit id="X" datatype="html">` devient `<unit id="X">` ;
   - `<note priority="1" from="meaning">V</note>` devient
     `<note category="meaning">V</note>` (idem pour `from="description"` →
     `category="description"`) ; un `trans-unit` avec plusieurs `context-group`
     donne plusieurs `<note category="location">chemin:lignes</note>`, un par
     `context-group` ;
   - un placeholder `<x id="ID" equiv-text="TEXTE"/>` devient
     `<ph id="0" equiv="ID" disp="TEXTE"/>` (le `id` du `<ph>` est numerique et
     repart de `0` a chaque unite ; `equiv` recoit l'ancien `id`, `disp` l'ancien
     `equiv-text`) ; le meme `<ph>` doit apparaitre a l'identique dans `<source>`
     et dans `<target>` ;
   - ecrire un `<target>` anglais naturel, en conservant les espaces significatifs
     de tete/fin du `<source>` et en normalisant la ponctuation francaise (espace
     avant `:`/`;`/`?`) a l'usage anglais standard.
   - Retirer un `trans-unit` de `messages.xlf` (id disparu du code source) doit
     retirer l'`unit` correspondante de `messages.en.xlf`.

3. Verifier qu'il ne reste aucun avertissement de traduction manquante :

   ```bash
   npm run build
   ```

   Inspecter la sortie : `0` occurrence de `No translation found` doit apparaitre
   pour la locale `en`. Un id present dans `messages.xlf` sans `unit` correspondante
   (ou dont le `<target>` est absent) declenche cet avertissement au build.

## Gouvernance depot

- Le proprietaire de code est defini dans [`.github/CODEOWNERS`](./.github/CODEOWNERS).
- Les regles de protection de branche a appliquer sur GitHub sont documentees dans [`docs/repository-governance.md`](./docs/repository-governance.md).
- Les decisions d'architecture sont historisees dans [`docs/adr`](./docs/adr).

## Garde-fous qualite

Chaque lot de changement coherent doit idealement valider :

- `npm run lint`
- `npm run format:check`
- `npm run typecheck`
- `npm run test:ci`
- `npm run build`

## Standards de contribution

- Les commentaires de code, la documentation, les descriptions de PR et les messages de commit sont rediges en francais par defaut.
- Les commits doivent rester atomiques : un sujet, un commit.
- Les messages suivent le format Conventional Commits, par exemple `feat(auth): ajoute le guard de refresh token`.
- Les hooks Git locaux font partie de la definition de done. Si un hook casse, on corrige la cause au lieu de le contourner.
- Toute evolution de route, contrat, architecture ou workflow implique une mise a jour de la documentation associee.
- Les contraintes SSR, accessibilite et i18n ne doivent jamais etre contournees pour livrer vite.

## Documentation

- [Guide de contribution](./CONTRIBUTING.md)
- [Standards d'ingenierie](./docs/engineering-standards.md)
- [Gouvernance du depot](./docs/repository-governance.md)
- [ADR](./docs/adr/README.md)
- [Garde-fous agent](./AGENTS.md)
