# Duplication à zéro — état verrouillé au 2026-09-25

Le front mesure désormais sa duplication par **deux moteurs**, avec un seuil **0** sur le
code applicatif comme sur le code de test.

## La porte

```bash
npm run quality:dup         # jscpd 5 puis jscpd 4, sur .jscpd.json
npm run quality:dup:tests   # jscpd 5 sur .jscpd.tests.json, jscpd 4 sur .jscpd4.tests.json
```

| Réglage     | Valeur                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| `minTokens` | 30                                                                        |
| `minLines`  | 5                                                                         |
| `mode`      | `weak`                                                                    |
| `threshold` | 0                                                                         |
| Formats     | TypeScript, gabarits (`markup`), SCSS, CSS, JavaScript                    |
| Applicatif  | `src/` et `scripts/`, hors specs, `src/testing/`, `e2e/`, locales, assets |
| Tests       | specs, `src/testing/` et `e2e/`                                           |

Pourquoi deux moteurs : jscpd 5 tokenise les gabarits en gros blocs et laisse passer des
clones que jscpd 4 voit ; jscpd 4 saute les fichiers de plus de 1000 lignes que jscpd 5
lit. Chacun couvre l'angle mort de l'autre. Un test de câblage plante un clone canari
dans un dépôt jetable et vérifie que chaque moteur le voit dans son périmètre et l'ignore
en dehors.

Aucune exclusion n'a été ajoutée pour atteindre zéro : pas d'`ignore` supplémentaire, pas
de marqueur `jscpd:ignore`, pas de renommage cosmétique. Les clones ont été résorbés par
extraction : composants partagés (`SlideEnTeteComponent`, `FieldErrorsComponent`,
`PictoComponent`, `ListePucesComponent`, `FormulaireAuthComponent`…), directive
`HoneypotDirective`, panneau de réglages remonté dans la classe de base `FpReglable`, et helpers
de test dans `src/testing/` (`setupTestBed`, `pageMontee`, `bancAdaptateurHttp`,
factories).

## Résultat

| Périmètre  | jscpd 5 | jscpd 4 |
| ---------- | ------- | ------- |
| Applicatif | 0 clone | 0 clone |
| Tests      | 0 clone | 0 clone |

Suites rejouées après le refactor, toutes vertes :

| Suite                                                                                                      | Résultat         |
| ---------------------------------------------------------------------------------------------------------- | ---------------- |
| `ci:check` jusqu'au build (lint, format, typecheck, dup, knip, gardes, Karma, build, `guard:cours-bundle`) | 3326 tests Karma |
| `test:e2e:portail` (SSR sur 4100/4101)                                                                     | 99 tests         |
| `test:banc`                                                                                                | 25 tests         |

`test:e2e:portail` a été lancé contre des serveurs SSR sur les ports 4100 et 4101 : le
port 4000 était occupé par un autre projet local.

La frontière AD-4 tient : `guard:cours-runtime` ne trouve aucun import de la surface
étudiante vers `features/cours/presentateur/`. `direct-de-l-ecran.ts`, partagé entre les
deux surfaces, a été sorti de `presentateur/` pour cette raison.

## Écarts de comportement trouvés et corrigés

Un refactor ne doit rien changer d'observable. Les relectures adverses ont trouvé ces
écarts, chacun corrigé en commençant par un test qui échouait :

- **Lien de connexion de `AuthSuccess`** — le libellé projeté par `ngProjectAs` portait
  un attribut `ngprojectas` rendu dans le DOM. Le libellé passe maintenant par l'entrée
  `libelleConnexion`, extraite en i18n sous les mêmes identifiants
  (`@@authResetGoToLogin`, `@@authVerifyGoToLogin`).
- **Préréglage de référence de `FpPlot`** — une valeur non numérique dans le préréglage
  de référence retombait sur le défaut du paramètre au lieu d'être calée au minimum. Le
  calcul d'origine est rétabli.
- **Attribut `name` des champs de mot de passe** — le formulaire de réinitialisation
  factorisé n'émettait plus l'attribut `name` ; `[attr.name]` le rétablit.
- **Garde du catalogue des briques** — l'héritage d'une interface commune
  (`ContenuDeBrique`) cachait les `metadonnees` au garde. Il suit désormais la chaîne
  `extends` ; un test synthétique le prouve.

Les dates `lastmod` de `src/assets/seo/seo-metadata.json`, réécrites par le build, ont été
remises à leur état initial.

## Écarts acceptés

Ils n'ont aucun effet visible pour l'utilisateur ni pour les technologies d'assistance :

- attributs de sélecteur vides rendus dans le DOM (`appfielderrors`, `apphoneypot`,
  `appasilisectiontete`), et nœuds de commentaire de `ng-template` ;
- attributs `bgimage` retirés des héros IA Solopreneurs ;
- espaces blancs dans le `textContent` de quelques boutons (animation de Concept4, liste
  de FpPro, FpNumeric) ;
- spécificité du sélecteur de `slide-en-tete`, avec un rendu identique ;
- garde présentateur morte de `FpSpaced` retirée ;
- notes XLF des messages d'erreur de champ regroupées avec le composant ;
- `fetch` non lié dans `lecture-api`.
