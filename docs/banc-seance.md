# Banc d'essai réel d'une séance de cours

Les suites Playwright du portail (`e2e/cours-*.spec.ts`) jouent sur des réponses HTTP
bouchonnées : elles prouvent que le front réagit correctement à un contrat, pas que ce contrat
est celui du serveur. Le banc comble ce trou. Il lève PostgreSQL, Redis, l'API NestJS et le front
en rendu serveur, puis joue une séance du cours B2-01 dans de vrais navigateurs, sans aucun
bouchon : ce qui traverse le réseau est ce que produit le back, sur une base migrée.

## Lancer le banc

```bash
npm run test:banc
```

Une seule commande. Elle monte tout, joue les scénarios et redescend tout, y compris en cas
d'échec et sur `Ctrl+C`.

Prérequis :

- Docker en marche ;
- le dépôt back cloné **à côté** du front (`../portfolio-2025-back`), avec ses dépendances
  installées (`pnpm install`) — le back est en pnpm, le front en npm, et cette frontière ne
  bouge pas ;
- les ports 3010, 4010, 55433 et 63790 libres.

## Ce que la commande enchaîne

| Étape              | Détail                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Base et cache      | `docker compose -p portfolio2025-banc` sur `scripts/banc/banc.compose.yaml`                        |
| Construction back  | `pnpm build` dans `../portfolio-2025-back`                                                         |
| Migrations         | toutes les migrations TypeORM appliquées à la base `portfolio_2025_banc`                           |
| API                | `node dist/main.js`, port 3010, journal dans `test-results/banc/api.log`                           |
| Compte formateur   | inscription par l'API réelle, rôle `teacher` accordé en SQL, connexion pour le jeton du banc       |
| Construction front | `npm run build:banc` — build SSR `fr`, `environment.banc.ts` pointant l'API du banc                |
| Scénarios          | `playwright test --project=banc --workers=1`, le serveur SSR étant démarré par Playwright sur 4010 |
| Démontage          | arrêt des groupes de processus enfants, puis `docker compose down -v --remove-orphans`             |

`scripts/banc/banc.compose.yaml` étend le service Postgres du back
(`../portfolio-2025-back/test/db-integration.compose.yaml`) au lieu d'en déclarer un second :
seuls le port, le nom de base et la sonde de santé sont surchargés, et un Redis est ajouté pour
que les plafonds de flux SSE soient tenus comme en production.

Le démontage est vérifié : après un run complet comme après un `Ctrl+C` en plein milieu, il ne
reste ni conteneur, ni volume, ni réseau du projet `portfolio2025-banc`, ni processus écoutant sur
3010 ou 4010. Les enfants sont lancés dans leur propre groupe de processus, ce qui permet de
descendre aussi le serveur SSR que Playwright avait démarré.

En cas de besoin après un arrêt brutal de la machine :

```bash
npm run banc:nettoyer
```

## Pourquoi le banc reste une porte locale

Le banc n'est **pas** joué par la CI du front, et c'est délibéré :

- Il lui faut les **deux dépôts**. La CI du front ne récupère que le front ; brancher le back
  demanderait un jeton d'accès à un second dépôt privé, stocké en secret dans celui-ci. Toute PR
  du front hériterait d'un droit de lecture sur le back : la surface de compromission augmente
  pour une porte qui ne décide rien.
- Le couple testé serait faux. Les deux dépôts se déploient indépendamment et n'ont pas de
  version commune ; la CI du front prendrait la branche par défaut du back. Un banc vert ne dirait
  rien du couple réellement en production, et un banc rouge accuserait le front d'une régression
  venue d'ailleurs.
- Le coût est réel : installation pnpm et dépendances du back, `tsc` du back, Postgres et Redis en
  services, migrations, build SSR du front, puis les scénarios — plusieurs minutes ajoutées à
  chaque PR, pour vérifier une intégration que la CI du back couvre déjà de son côté
  (`test:integration:db`, `test:e2e:http`).

Le banc se joue donc à la main, avant chaque déploiement qui touche le cours et avant toute
bascule de version publiée. Le jour où les deux dépôts partageront un pipeline de déploiement, il
s'y branche sans rien changer : `npm run test:banc` suppose seulement que le back est à côté.

## Ce que le banc couvre

Les scénarios vivent dans `e2e/banc/`. Ils jouent sur la **version publiée** du cours, relevée au
moment du run : aucune constante d'écran n'est figée dans les tests.

Le relevé (`coursReleve` dans `e2e/banc/contexte.ts`) ouvre une séance, projette le dernier écran
et lit `GET /sessions/:id/sujet` avec le jeton d'un poste. C'est la seule surface qui rend les
écrans de diffusion `seance` : le catalogue public les sert verrouillés, sans leurs questions. Le
relevé en tire les questions à options, les votes et les réflexions, avec leur rang, leur
identifiant d'activité et leurs identifiants d'option — jumelle comprise pour un vote à deux
temps.

| Fichier                   | Ce qui est prouvé                                                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reprise.spec.ts`         | un poste répond, recharge, retrouve sa séance et son état serveur ; une seconde réponse est refusée (`REPONSE_DEJA_ENREGISTREE`) sans rien écrire                                                                                         |
| `ecran-non-servi.spec.ts` | toute réflexion au-delà de l'écran servi est refusée (`ECRAN_NON_SERVI`), le poste la garde hors ligne puis affiche le refus au retour du réseau ; les rappels espacés suivent la même garde, et s'ouvrent dès que leur écran est projeté |
| `vote-jumele.spec.ts`     | deux navigateurs votent en même temps et le pupitre compte les deux ; le pilotage mène `vote` → `discussion` → `revote` → `revele`, le poste bascule sur la jumelle au revote et reçoit son verdict à la révélation                       |
| `cadence-flux.spec.ts`    | deux onglets formateur reçoivent les mêmes `resultats`, au plus une fois par seconde, barème compris                                                                                                                                      |
| `eviction.spec.ts`        | le poste évincé perd l'accès (`PARTICIPANT_INTROUVABLE`), sa place est reprise, ses réponses restent comptées au bilan                                                                                                                    |
| `salle-chargee.spec.ts`   | 35 postes rejoignent depuis une seule adresse, le 36ᵉ est refusé (`SEANCE_COMPLETE`), le débit reste indexé sur le jeton                                                                                                                  |
| `cloture.spec.ts`         | le pupitre mène la séance de l'ouverture à la clôture et la synthèse reflète ce que les postes ont répondu                                                                                                                                |

## Ce que le banc ne joue pas

Le banc pilote un navigateur : il couvre les écrans où un poste choisit une option et les
réflexions libres. Les briques de production longue — tableur, construction de tableau, classement
de cartes, énigmes, exemples travaillés — sont jouées côté back, sur le même deck publié, par
`test/formations-v3-classe.db-integration.spec.ts`, qui pilote les cinquante-deux écrans avec
trente étudiants simultanés, de l'ouverture au rapport de clôture.

## Contraintes connues

- **Un seul worker.** L'API tourne en une seule instance (décision B30 du back) et le serveur SSR
  est un unique processus Node : les scénarios se jouent en série. C'est aussi ce qui rend les
  mesures de cadence lisibles.
- **Connexions limitées à dix par heure.** `POST /auth/login` est plafonné côté API. Le banc se
  connecte une seule fois à l'amorçage et passe le jeton aux scénarios par l'environnement ; seul
  `cloture.spec.ts` rejoue une connexion réelle par le formulaire. Le compteur vit dans le
  processus de l'API, qui redémarre à chaque run.
- **Le banc reconstruit le back.** `pnpm build` efface `dist/` dans le dépôt voisin : ne pas
  lancer le banc pendant un `ci:check` du back. Le harnais détecte le cas et le nomme au lieu de
  démarrer une API fantôme.
- **Aucun courriel n'est envoyé.** SMTP est neutralisé dans l'environnement du banc ; la clôture
  écrit les scores et rend la synthèse, mais les messages de fin de séance ne sont pas capturés.
  Leur vérification reste du ressort de la CI du back.
