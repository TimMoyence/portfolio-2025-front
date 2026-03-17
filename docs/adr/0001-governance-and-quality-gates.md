# 0001 - Gouvernance qualite et protection de branche

- Statut : accepte
- Date : 2026-03-17

## Contexte

Le depot doit rester exploitable par un developpeur qui ne connait pas l'historique du projet. Sans garde-fous explicites, les conventions, la qualite et la securite derivent progressivement.

## Decision

Le frontend adopte une gouvernance minimale obligatoire :

- `CODEOWNERS` pour rendre explicite le proprietaire de revue ;
- branche `master` protegee par pull request ;
- checks obligatoires `quality-gate` et `security` ;
- hooks locaux `pre-commit`, `commit-msg` et `pre-push` ;
- seuil minimal de couverture en CI pour eviter une regression silencieuse.

## Consequences

- Les merges deviennent plus lents mais plus fiables.
- Les checks CI doivent garder des noms stables.
- Toute evolution de gouvernance doit etre documentee dans le meme changement.
