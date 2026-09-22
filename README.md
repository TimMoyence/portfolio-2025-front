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
- `/atelier`, `/atelier/meteo`, `/atelier/sebastian`, `/client-project` — Redirections permanentes vers `/projets`

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

Le sitemap ajoute les slugs d'articles publies quand `PORTFOLIO_ARTICLE_API_URL` pointe vers le backend public (`.../api/v1/portfolio25`). Sans cette variable, il reste statique et ne publie aucune URL inventee. Le `lastmod` des autres pages suit le dernier commit front qui les touche (`npm run seo:lastmod`) ; pour un cours servi par l'API, comme le B2, la même variable sert à lire `publieLe` sur `/formations/catalogue/:slug` et le sitemap publie la plus récente des deux dates, avec un avertissement journalisé à chaque repli : voir [`docs/seo-lastmod.md`](./docs/seo-lastmod.md).

### Formations

- `/formations` — Liste des formations
- `/formations/ia-solopreneurs` — Formation IA Solopreneurs (slides)
- `/formations/ia-solopreneurs/toolkit` — Toolkit IA Solopreneurs (capture email)
- `/formations/ia-solopreneurs/toolkit/:token` — Toolkit personnalise (acces direct via token, rendu serveur on-demand)
- `/formations/automatiser-avec-ia` — Formation Automatiser avec l'IA (slides)
- `/formations/automatiser-avec-ia/toolkit` — Toolkit Automatiser avec l'IA
- `/formations/audit-seo-diy` — Formation Audit SEO DIY (slides)
- `/formations/audit-seo-diy/toolkit` — Toolkit Audit SEO DIY
- `/formations/b2-01-traitement-information-chiffree` — Cours B2-01 (72 écrans servis par le back via `/formations/catalogue/:slug`), rendu serveur à la demande (`RenderMode.Server`) pour refléter le contenu publié au moment de la visite. Hors séance, les quiz et réflexions sont en aperçu : rien n'est envoyé, le résultat n'est donné qu'en séance. La page propose « Rejoindre une séance » vers `/cours/rejoindre` ; la carte de `/formations` y mène.

### Médias du cours B2-01

La capsule vidéo et les images du cours sont versionnées dans `src/assets/cours/b2-01/v3/` et servies comme le reste des assets. `medias.manifest.json`, servi à côté d'elles, porte pour chaque média son format, ses dimensions, sa source et sa licence ; `e2e/cours-medias.spec.ts` vérifie que chaque entrée du manifeste est réellement livrée et atteignable en SSR.

### Cours en séance

Pages non indexables (`noindex, nofollow`), en rendu client (`RenderMode.Client`). Le cours est servi par le back (`/formations/sessions/...`) : le front ne porte ni corrigé ni barème.

- `/cours/rejoindre` — Vue étudiant, sans compte : code de séance, identité, puis écrans du sujet tiré pour l'étudiant (rendu main).
- `/cours/presenter/:slug` — Pupitre du formateur (`authGuard` + `roleGuard("teacher")`) : ouverture de la séance du cours `:slug`, code à dicter, statistiques de séance et règle de notation, commandes, notes, résultats par question face au seuil, panneau pédagogique (guide, lecture de la classe, réponses libres, groupes, annotations, export du bilan), clôture.
- `/cours/presenter/:slug?seance=:sessionId` — Reprise du pupitre d'une séance déjà ouverte : aucune nouvelle ouverture ; le code, les résultats, le déroulé et l'écran courant sont relus. Le pupitre inscrit lui-même `?seance=` dans l'URL dès l'ouverture.
- `/cours/presenter/:slug/scene/:sessionId` — Scène pour le vidéoprojecteur (`authGuard` + `roleGuard("teacher")`) : écran courant en rendu `stage`, sans notes ni corrigé ; un quiz y affiche seulement le nombre de réponses reçues sur le nombre de participants, sans options cliquables. Hors de la coquille du site (`data.coquille = false` : ni barre de navigation, ni pied de page, ni bandeau cookies).
- `/cours/seance/:sessionId/synthese` — Synthèse de la séance close (`authGuard`).
- `/cours/demo` — Ancienne URL de banc d’essai, redirigée vers `/formations` ; les briques sont
  testées directement par leurs tests de composant.

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

## Essais de bout en bout

`playwright.config.ts` declare deux projets, volontairement disjoints :

| Projet     | Contenu              | Commande            | Ce qu'il sert                                                    |
| ---------- | -------------------- | ------------------- | ---------------------------------------------------------------- |
| `chromium` | `e2e/*.spec.ts`      | `npm run test:e2e`  | parcours navigateur sur reponses HTTP bouchonnees, joue en CI    |
| `banc`     | `e2e/banc/*.spec.ts` | `npm run test:banc` | seance reelle : front SSR + API + PostgreSQL, sans aucun bouchon |

`npm run test:e2e:portail` est la porte jouee par la CI : elle demarre les serveurs SSR `fr` et
`en` puis rejoue le projet `chromium`, qui ignore le banc.

Aucune suite ne compare d'instantane d'ecran : les assertions portent sur le DOM, les reponses
HTTP et les evenements recus, pas sur des pixels.

Le banc monte lui-meme sa pile, joue une seance du cours B2-01 dans de vrais navigateurs et
redescend tout, y compris en cas d'echec. Il demande Docker et le depot back clone a cote du
front. Il n'est pas joue par la CI : la decision et ce qu'il couvre sont dans
[`docs/banc-seance.md`](./docs/banc-seance.md). Il se joue avant chaque deploiement qui touche le
cours.

## Conduire une séance de cours

Matériel : un portable pour le pupitre, un écran étendu (vidéoprojecteur) pour la scène, les téléphones des étudiants. Un seul navigateur sur le portable pour le pupitre et la scène.

1. **Connexion** : se connecter sur `/login` avec le compte formateur (rôle `teacher`), puis cliquer sur « Consulter » pour le cours ou ouvrir `/cours/presenter/<slug>` (par exemple `b2-01-traitement-information-chiffree`). Le pupitre ouvre automatiquement une séance quand l'URL ne contient pas encore `?seance=`. Le jeton d'accès (15 min) se renouvelle seul pendant toute la séance, par un seul appel au serveur par rotation quel que soit le nombre de fenêtres ouvertes : sous un verrou inter-onglets, chaque fenêtre relit le jeton stocké et adopte sans appel réseau celui qu'une autre fenêtre vient d'obtenir. Le serveur limite ce renouvellement à 60 appels par heure et conserve une fenêtre de grâce de 60 secondes pour une réponse perdue sur le réseau ; au-delà (429), la fenêtre réessaie après le délai `Retry-After` sans effacer la session.
2. **Ouverture** : le code à quatre chiffres s'affiche en grand et l'URL prend `?seance=<id>`. En cas d'échec réseau, le bouton de reprise apparaît ; une nouvelle ouverture créerait une autre séance avec un autre code.
3. **Scène** : « Projection plein écran » ouvre la projection dans une fenêtre nommée ; la glisser sur l'écran étendu et la passer en plein écran (ou F11). Une pastille discrète dans un coin indique l'état du suivi (vert : en direct ; orange : reconnexion ; rouge : refus).
4. **Inscription de la classe** : dicter le code ; les étudiants ouvrent `/cours/rejoindre` et saisissent code, prénom, nom et adresse e-mail. Tant que la séance n'est pas démarrée, ou tant que le téléphone n'a reçu aucun état de la séance, il affiche un message d'attente et aucune question n'est répondable.
5. **Contrôle de l'effectif** : comparer le compteur « Participants » du pupitre à l'effectif présent. Un écart signale une inscription en trop : clôturer et rouvrir une séance avant de démarrer.
6. **« Démarrer la séance »** : obligatoire avant la première question, rappel d'ouverture compris ; avant ce clic, le serveur refuse toute réponse.
7. **Pilotage** : « Écran suivant » / « Écran précédent », un toggle visuel pour le rythme libre ou piloté, lecture des résultats par question (réponses reçues, bonnes réponses, « je ne sais pas », seuil, confusions) et « Aller à la remédiation » sous le seuil. Le bandeau de statut du pupitre n'apparaît que si le suivi doit se reconnecter ou si le serveur le refuse (401/403 : recharger le pupitre et se reconnecter si la page de connexion s'affiche ; 429 : fermer les onglets en trop).
8. **Statistiques et notation** : sous le code, le pupitre affiche la moyenne, la médiane, la dispersion (écart-type), la participation, la réussite et les questions problématiques (par leur énoncé), puis la règle de notation servie par le serveur dans une aide au survol du bouton `i` : note relative aux plus actifs, seuil de signalement, prise en compte du « je ne sais pas », valeur d'une non-réponse, réponses libres notées ou non et seuil d'une question problématique. En reprise, elles sont relues du rapport de séance.
9. **Panneau pédagogique** (à côté de l'écran courant) : guide de facilitation de l'écran (à dire, question à poser, réponse attendue masquée tant qu'elle n'est pas révélée, calcul, relance, transition) ; lecture de la classe (taux de réussite, réponses reçues, confiance du diagnostic) ; réponses libres des étudiants à l'écran courant ; groupes de suivi (créer, renommer, affecter chaque participant) ; annotation du formateur pour l'écran, pour la classe entière ou un groupe, enregistrée sur le serveur au fil de la saisie. « Exporter le bilan » télécharge le rapport de séance en JSON (`bilan-seance-<id>.json`).
10. **Réponses libres** : sur un écran de réflexion, l'étudiant rédige puis « Garder cette réflexion » ; sans réseau, la réflexion reste sur l'appareil et part au retour de la connexion. La scène indique seulement que chacun répond sur son appareil.
11. **Clôture** : « Clôturer la séance », puis confirmer. Les réponses ne sont plus acceptées.
12. **Synthèse** : le pupitre ouvre `/cours/seance/<id>/synthese` (classement, résultats par question, confusions fréquentes, export CSV).

Hors séance (page publique `/formations/b2-01-traitement-information-chiffree`), les quiz et réflexions s'affichent en aperçu : le choix n'est pas envoyé, la réflexion n'est ni envoyée ni conservée, et aucun résultat n'est donné.

Incidents :

- **La scène se fige** (pastille orange ou rouge durable, écran en retard sur le pupitre) : recharger la fenêtre de la scène (F5). Elle relit le déroulé et reprend l'écran courant. Un flux resté muet 45 s est de toute façon relancé automatiquement.
- **Le pupitre est rechargé, fermé ou renvoyé vers la connexion** : après reconnexion, `returnUrl` ramène seul à `/cours/presenter/<slug>?seance=<id>`, y compris quand la session expirée est découverte au rechargement ; un pupitre fermé se rouvre par cette URL (l'identifiant est aussi dans l'URL de la scène, `/scene/<id>`). Le pupitre reprend la séance, son code, ses résultats et l'écran courant, sans rien rouvrir ; ses commandes de pilotage restent désactivées jusqu'au premier état reçu du suivi, la clôture restant possible. Tant que la séance est ouverte, le navigateur demande confirmation avant de quitter la page.
- **« La vérification de votre session n'a pas abouti »** : le jeton est conservé ; vérifier le réseau, puis « Réessayer ».
- **Réponse étudiante non partie** : une panne réseau ou serveur, ou la limite de cadence du serveur (429), la garde sur le téléphone et la renvoie après l'envoi suivant, à chaque changement d'état de la séance ou au retour du réseau ; un refus explicite (séance non démarrée, requête refusée, jeton de participant refusé en 401) s'affiche sur le téléphone, sans le quitter, et n'est pas mis en file.

## Hooks Git et verrous locaux

Apres `npm ci`, Husky installe automatiquement trois hooks :

- `pre-commit` : lance `lint-staged` pour formatter et lint uniquement les fichiers indexes ;
- `commit-msg` : impose un message au format Conventional Commit ;
- `pre-push` : lance `npm run pre-push:check`, qui rejoue toute la porte qualite (voir plus bas) et se termine par `npm run test:e2e:cours` la ou la CI joue `npm run test:e2e:portail`.

Ces hooks ne remplacent pas la CI, mais `pre-push:check` en couvre l'essentiel : un push sale est bloque avant d'atteindre GitHub.

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
   - Un `trans-unit` dont le texte francais a change garde son id : reporter la
     nouvelle `<source>` dans l'`unit` anglaise **et** retraduire la `<target>`.
     Angular n'associe traduction et texte que par l'id, il servirait sinon
     l'ancienne phrase en anglais sans aucun avertissement.

3. Verifier la synchronisation des deux fichiers :

   ```bash
   npm run test:guards
   ```

   La garde `scripts/guard-i18n-sync.test.mjs` compare `messages.xlf` et
   `messages.en.xlf` (placeholders ramenes a leur nom, entites et espaces
   normalises) et echoue sur trois ecarts : un id extrait sans `unit` anglaise ou
   sans `<target>`, une `unit` anglaise dont la `<source>` n'est plus le texte
   francais actuel (traduction perimee), une `unit` anglaise dont l'id n'est plus
   extrait. Elle lit les fichiers commites : lancer `npm run extract-i18n` avant.

4. Verifier qu'il ne reste aucun avertissement au build :

   ```bash
   npm run build
   ```

   Inspecter la sortie : `0` occurrence de `No translation found` pour la locale
   `en`, et `0` avertissement `Duplicate messages with id`. Un meme id `@@…` ne
   peut porter qu'un seul texte ; deux textes identiques peuvent le partager.

## Gouvernance depot

- Le proprietaire de code est defini dans [`.github/CODEOWNERS`](./.github/CODEOWNERS).
- Les regles de protection de branche a appliquer sur GitHub sont documentees dans [`docs/repository-governance.md`](./docs/repository-governance.md).
- Les decisions d'architecture sont historisees dans [`docs/adr`](./docs/adr).

## Garde-fous qualite

`npm run ci:check` est la porte complete, dans l'ordre : `lint`, `format:check`, `typecheck`,
`quality:dup`, `quality:dup:tests`, `quality:knip`, `test:guards`, `guard:cours-runtime`,
`guard:comments`, `test:ci`, `build`, `guard:cours-bundle`, `test:e2e:portail`.
`npm run pre-push:check` est la meme chaine, terminee par `test:e2e:cours` (les seules suites du
cours) au lieu du portail complet.

Ce que chaque garde specifique tient :

- `npm run quality:dup` et `quality:dup:tests` — duplication (jscpd) sur `src` et `scripts`, puis
  sur les seules suites de `src`, cette derniere a seuil zero.
- `npm run quality:knip` — fichiers, exports et dependances morts.
- `npm run test:guards` — `node --test` sur `scripts/**/*.test.mjs` : gardes d'outillage, moteur de
  formules, catalogue de briques, synchronisation i18n (`guard-i18n-sync`), banc.
- `npm run guard:cours-runtime` — AD-2 : `src/cours/` n'importe aucun framework (Angular, RxJS,
  zone.js) et rien hors de `src/cours/` : c'est une couche feuille dont les briques sont des
  Custom Elements construits par le navigateur, hors du contexte d'injection d'Angular ; AD-4 : aucune
  donnée de correction (bonne réponse, misconception, barème…) dans la surface compilée pour
  l'étudiant, soit `src/cours/content/`, les fichiers « cours » de `src/app/`, le rendu partagé
  `src/app/shared/slides/**` et les pages `src/app/features/formations/b2-*`. Seul le pupitre
  (`src/app/features/cours/presentateur/`) nomme le corrigé, reçu au runtime.
- `npm run guard:comments` — plafond a zero commentaire narratif dans `src/`, `e2e/` et
  `scripts/` : seule une contrainte externe citee avec sa source passe.
- `npm run guard:cours-bundle` — apres `npm run build`, aucune cle `misconception` suivie d'une
  valeur litterale dans `dist/`.

`npm run test:banc` s'ajoute a cette porte hors CI, avant un deploiement qui touche le cours.

## Standards de contribution

- Les commentaires de code, la documentation, les descriptions de PR et les messages de commit sont rediges en francais par defaut.
- Les commits doivent rester atomiques : un sujet, un commit.
- Les messages suivent le format Conventional Commits, par exemple `feat(auth): ajoute le guard de refresh token`.
- Les hooks Git locaux font partie de la definition de done. Si un hook casse, on corrige la cause au lieu de le contourner.
- Toute evolution de route, contrat, architecture ou workflow implique une mise a jour de la documentation associee.
- Les contraintes SSR, accessibilite et i18n ne doivent jamais etre contournees pour livrer vite.

## Documentation

- [Guide de contribution](./CONTRIBUTING.md)
- [Banc d'essai reel d'une seance](./docs/banc-seance.md)
- [Standards d'ingenierie](./docs/engineering-standards.md)
- [Gouvernance du depot](./docs/repository-governance.md)
- [ADR](./docs/adr/README.md)
- [Garde-fous agent](./AGENTS.md)
