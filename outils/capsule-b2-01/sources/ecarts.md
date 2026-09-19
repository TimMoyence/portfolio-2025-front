## Écarts avec l’annexe A et justification

1. **Durée 151,67 s (cible 150 s, fenêtre 145–155 s respectée).** Les dix voix Piper durent 126,50 s
   au `length_scale` 1,15 prescrit. La pause qui donnerait 150 s pile vaut 1,35 s, sous le minimum de
   1,5 s du § A.1 (étape 4) : la pause est tenue à 1,5 s (plus l’arrondi de chaque plan à l’image
   près), le texte n’est pas touché.
2. **Synthèse par l’API Python de Piper 1.8 plutôt que par la commande `piper`.** Même modèle, même
   `length_scale` 1,15, même texte, un fichier par plan, phrases enchaînées sans silence ajouté, comme
   la commande. Deux ajouts : une graine ONNX Runtime fixe (20260919), posée avant chaque chargement du
   modèle, car les deux nœuds `RandomNormalLike` du modèle VITS n’ont pas de graine et deux exécutions
   donnaient jusqu’à 7 % d’écart de durée ; les alignements par phonème (`include_alignments`), qui
   donnent l’instant de chaque mot pour caler les visuels et les sous-titres. Les pistes sont
   reproductibles à l’octet près.
3. **Prononciation de « SI » (P07).** espeak-ng épelle un mot de deux capitales (« ɛsi ») ; aucune
   ponctuation n’y remédie. Le texte envoyé à Piper porte « si l’arrondi » ; `sources/voix/P07.txt`
   reste identique au § A.4 (règle dans `sources/prononciation.json`). Les neuf autres plans sont lus
   tels quels ; la relecture a porté sur la transcription phonétique d’espeak-ng. Une écoute humaine
   reste recommandée avant publication.
4. **Normalisation linéaire obtenue avec un limiteur.** Piper normalise chaque phrase à 0 dBFS de
   crête : la narration brute mesure déjà −16,0 LUFS mais +0,06 dBTP, si bien que `loudnorm` avec
   `linear=true` bascule de lui-même en mode dynamique. Un `alimiter` à −3 dBFS (sans gain
   automatique) précède `loudnorm` dans les deux passes ; le mode obtenu est bien `linear`.
5. **Placement des pistes.** Rééchantillonnage à 48 kHz avant `adelay`/`apad`, puis `atrim` à
   l’échantillon près, pour que la piste finale dure exactement le nombre d’images × 1/30 s (la
   commande du § A.1 remplit à 22,05 kHz puis rééchantillonne, d’où un écart possible d’un échantillon).
6. **Sous-titres calés sur les mots réels.** Chaque réplique commence au premier mot qu’elle transcrit
   (alignement Piper) au lieu d’une durée proportionnelle au nombre de caractères. Les règles du § A.1
   (étape 9) sont tenues : 2 lignes de 42 caractères au plus, 15 car./s au plus, 11,2 car./s en
   moyenne, réplique trop dense prolongée sur la suite puis sur la pause. P09 est dit à environ
   17,7 car./s : ses deux dernières répliques prennent jusqu’à 0,94 s de retard (la méthode
   proportionnelle donnerait le même retard). Dans les plans denses (P04, P09), la première réplique
   paraît pendant les 0,4 s d’attaque silencieuse. Espaces insécables typographiques (milliers, « : »,
   « % », « € », guillemets) ; bloc `NOTE` de crédits en tête du fichier.
7. **Grille.** Cinq colonnes de 150 px ne tiennent pas dans x 40–780 (740 px) : cellules de
   148 × 48 px, colonnes A à E exactement sur x 40–780, numéros de ligne dans la marge (x 8–40). Les
   en-têtes de la ligne 1 sont sur deux lignes (« Ventes 2024 / (€ HT) »), A9 s’étend sur A9:B9 en deux
   lignes (« Compte de résultat / 2025 : ventes de sacs »), comme un tableur déborde sur une cellule
   vide. La grille finit à y 570 ; le bouton occupe y 582–624 ; les 90 px du bas restent vides.
8. **Recopies de P06 à 0,9 s d’intervalle.** L’intervalle de 1,2 s n’est prescrit qu’en P04 ; en P06,
   il ferait apparaître le 1 de E6 0,6 s après que la voix a dit « vaut 1 ».
9. **Accolades de P07 dans le panneau.** Les 15 px entre la barre de formule (y 95) et la grille
   (y 110) ne logent ni accolades ni étiquettes : le panneau reprend la formule en police mono 20 px,
   avec cinq accolades numérotées et une légende en 25 px portant exactement les libellés du § A.4.
   Chaque accolade s’allume quand son morceau est entièrement frappé, au rythme de la voix, ce qui
   donne l’ordre de la liste du § A.4 (SOMME, ARRONDI, = 1 ?, alors 1, sinon 0).
10. **Crédits.** Le carton P11 et les métadonnées WebM portent « Tim Moyence — Asili Design, 2026 »
    (auteur demandé) au lieu de « Asili Design, 2026 » (§ A.7), précisent « licence MIT » pour le
    modèle et nomment les quatre auteurs du corpus SIWIS (la CC BY 4.0 demande d’identifier les
    créateurs). Le paragraphe de crédits de A4-01 et l’attribution de M5 au § 8.2 disent encore
    « Asili Design, 2026 » : à aligner si l’on veut la même mention partout.
11. **Chromium.** Le Playwright 1.59.1 du dépôt front attend `chromium_headless_shell-1217`, absent
    du cache ; la page est rendue par `chrome-headless-shell` 151.0.7922.34 (build 1234) déjà présent
    dans le cache Playwright, passé en `executablePath`. Rien n’est installé dans le dépôt.
12. **Compléments visuels, sans nouvelle notion.** Un cadre épais signale E8 quand la voix dit « passe
    à 0 » puis « revient à 1 » ; la puce « erreur » accompagne #DIV/0! comme l’exige la charte
    (icône et mot) ; le panneau de P05 reprend `E2 =C2/C6` et `E3 =C3/C7` au-dessus de « C6 a glissé en
    C7 » ; P10 porte le titre « Récapitulatif » ; le curseur s’écarte après la frappe de E9 pour que
    l’affiche soit dégagée.
13. **Métadonnées WebM et multiplexage reproductible.** Titre, auteur, licence, crédits et langue de la
    piste audio (`fre`) sont ajoutés à la commande d’encodage de l’étape 7, ainsi que
    `-fflags +bitexact` : sans lui, le multiplexeur Matroska tire au hasard ses identifiants de segment
    et de piste et deux productions identiques diffèrent d’octets. Les paramètres de codage sont ceux
    du § A.1.
14. **Images.** WebP en qualité 90 (la plus lourde, M4, pèse 319 ko) ; aucun agrandissement (M1 reste
    à 1 137 px et M4 à 1 500 px de large, sous le plafond de 1 600 px).
