const LIBELLES: Readonly<Record<string, () => string>> = {
  valider: () => $localize`:@@coursRuntimeValider:Valider`,
  suivant: () => $localize`:@@coursRuntimeSuivant:Suivant`,
  precedent: () => $localize`:@@coursRuntimePrecedent:Précédent`,
  'je-ne-sais-pas': () => $localize`:@@coursRuntimeJeNeSaisPas:Je ne sais pas`,
  'en-attente': () => $localize`:@@coursRuntimeEnAttente:En attente de votre réponse`,
  'reponse-enregistree': () => $localize`:@@coursRuntimeReponseEnregistree:Réponse enregistrée`,
  'saisie-non-numerique': () =>
    $localize`:@@coursRuntimeSaisieNonNumerique:Saisissez un nombre — la virgule décimale est acceptée`,
  'a-revoir': () => $localize`:@@coursRuntimeARevoir:Pas encore — regardons pourquoi`,
  confirme: () => $localize`:@@coursRuntimeConfirme:C’est juste`,
  'discussion-en-cours': () =>
    $localize`:@@coursRuntimeDiscussionEnCours:Discutez avec votre voisin`,
  revoter: () => $localize`:@@coursRuntimeRevoter:Voter à nouveau`,
  envoyer: () => $localize`:@@coursRuntimeEnvoyer:Envoyer`,
  'rappel-consigne': () =>
    $localize`:@@coursRuntimeRappelConsigne:Écrivez tout ce dont vous vous souvenez, sans regarder vos notes`,
  'rappel-restant': () => $localize`:@@coursRuntimeRappelRestant:Options disponibles dans`,
  'rappel-termine': () => $localize`:@@coursRuntimeRappelTermine:Options disponibles`,
  'choix-obligatoire': () =>
    $localize`:@@coursRuntimeChoixObligatoire:Choisissez une réponse avant d’envoyer`,
  'texte-libre-trop-long': () =>
    $localize`:@@coursRuntimeTexteLibreTropLong:Réduisez votre réponse à`,
  'caracteres-maximum': () => $localize`:@@coursRuntimeCaracteresMaximum:caractères maximum`,
  chargement: () => $localize`:@@coursRuntimeChargement:Chargement…`,
  'hors-ligne': () =>
    $localize`:@@coursRuntimeHorsLigne:Hors ligne — vos réponses seront envoyées à la reconnexion`,
  'pulse-perdu': () => $localize`:@@coursRuntimePulsePerdu:Perdu`,
  'pulse-ca-va': () => $localize`:@@coursRuntimePulseCaVa:Ça va`,
  'pulse-clair': () => $localize`:@@coursRuntimePulseClair:C’est clair`,
  'pulse-anonymat': () =>
    $localize`:@@coursRuntimePulseAnonymat:Réponses anonymes : personne ne voit qui a répondu quoi`,
  'pulse-votre-etat': () => $localize`:@@coursRuntimePulseVotreEtat:Votre état actuel :`,
  'pulse-total': () => $localize`:@@coursRuntimePulseTotal:Réponses reçues :`,
  'challenge-consigne': () =>
    $localize`:@@coursRuntimeChallengeConsigne:Cherchez par vous-même : aucune méthode ne vous a encore été donnée`,
  'challenge-tentative-vide': () =>
    $localize`:@@coursRuntimeChallengeTentativeVide:Écrivez votre tentative, même imparfaite : c’est elle qui compte`,
  'challenge-reveler': () => $localize`:@@coursRuntimeChallengeReveler:Voir les stratégies`,
  'challenge-strategies': () => $localize`:@@coursRuntimeChallengeStrategies:Stratégies typiques`,
  'challenge-fausse': () => $localize`:@@coursRuntimeChallengeFausse:Piste fausse`,
  'pro-geste': () => $localize`:@@coursRuntimeProGeste:Le geste professionnel`,
  'pro-consequence': () => $localize`:@@coursRuntimeProConsequence:Sur le terrain :`,
  'concept4-reglages': () =>
    $localize`:@@coursRuntimeConcept4Reglages:Faites varier les paramètres et observez les quatre faces`,
  'concept4-animer': () => $localize`:@@coursRuntimeConcept4Animer:Animer le calcul`,
  'concept4-formule': () => $localize`:@@coursRuntimeConcept4Formule:Formule`,
  'concept4-graphique': () => $localize`:@@coursRuntimeConcept4Graphique:Graphique`,
  'concept4-courbe': () =>
    $localize`:@@coursRuntimeConcept4Courbe:Courbe du résultat en fonction du paramètre`,
  'concept4-tableau': () => $localize`:@@coursRuntimeConcept4Tableau:Tableau de valeurs`,
  'concept4-phrase': () => $localize`:@@coursRuntimeConcept4Phrase:En mots`,
  'concept4-resultat': () => $localize`:@@coursRuntimeConcept4Resultat:Résultat`,
  'concept4-plage': () => $localize`:@@coursRuntimeConcept4Plage:de`,
  'concept4-plage-fin': () => $localize`:@@coursRuntimeConcept4PlageFin:à`,
  'worked-consigne': () =>
    $localize`:@@coursRuntimeWorkedConsigne:Suivez le raisonnement, puis reprenez les étapes laissées de côté`,
  'worked-a-vous': () => $localize`:@@coursRuntimeWorkedAVous:À vous de rédiger cette étape`,
  'worked-pourquoi': () => $localize`:@@coursRuntimeWorkedPourquoi:Pourquoi cette étape ?`,
  'worked-etape-vide': () =>
    $localize`:@@coursRuntimeWorkedEtapeVide:Rédigez chaque étape laissée de côté avant de valider`,
  'worked-niveau': () => $localize`:@@coursRuntimeWorkedNiveau:Étapes montrées :`,
  'plot-reglages': () =>
    $localize`:@@coursRuntimePlotReglages:Faites varier les paramètres et observez la forme des courbes`,
  'plot-animer': () => $localize`:@@coursRuntimePlotAnimer:Voir l’évolution`,
  'plot-selon': () => $localize`:@@coursRuntimePlotSelon:en fonction de`,
  'plot-legende': () => $localize`:@@coursRuntimePlotLegende:Légende des courbes`,
  'plot-trait-plein': () => $localize`:@@coursRuntimePlotTraitPlein:trait plein`,
  'plot-trait-tirets': () => $localize`:@@coursRuntimePlotTraitTirets:trait en pointillés`,
  'plot-tableau': () => $localize`:@@coursRuntimePlotTableau:Valeurs aux deux extrémités`,
  'plot-serie': () => $localize`:@@coursRuntimePlotSerie:Courbe`,
  'plot-ecart': () => $localize`:@@coursRuntimePlotEcart:Écart entre les deux courbes :`,
  'plot-aucune-serie': () =>
    $localize`:@@coursRuntimePlotAucuneSerie:Aucune courbe à tracer : la définition ne porte aucune série`,
  'plot-plage': () => $localize`:@@coursRuntimePlotPlage:de`,
  'plot-plage-fin': () => $localize`:@@coursRuntimePlotPlageFin:à`,
  'table-build-consigne': () =>
    $localize`:@@coursRuntimeTableBuildConsigne:Bâtissez le tableau ligne à ligne : chaque cellule déduite se recalcule dès que vous saisissez`,
  'table-build-echeance': () => $localize`:@@coursRuntimeTableBuildEcheance:Échéance`,
  'table-build-a-saisir': () => $localize`:@@coursRuntimeTableBuildASaisir:à saisir`,
  'table-build-deduite': () => $localize`:@@coursRuntimeTableBuildDeduite:déduite`,
  'table-build-totaux': () => $localize`:@@coursRuntimeTableBuildTotaux:Totaux`,
  'table-build-solde': () =>
    $localize`:@@coursRuntimeTableBuildSolde:Capital restant dû après la dernière échéance :`,
  'table-build-cellule-vide': () =>
    $localize`:@@coursRuntimeTableBuildCelluleVide:Complétez chaque cellule à saisir avant de valider`,
  'table-build-progression': () =>
    $localize`:@@coursRuntimeTableBuildProgression:Cellules saisies :`,
  'table-build-vide': () =>
    $localize`:@@coursRuntimeTableBuildVide:Aucune ligne à bâtir : le plan ne porte aucune échéance`,
  'sheet-consigne': () =>
    $localize`:@@coursRuntimeSheetConsigne:Écrivez vos formules : commencez par « = », citez les cellules par leur nom, séparez les arguments par un point-virgule`,
  'sheet-coin': () => $localize`:@@coursRuntimeSheetCoin:Cellule`,
  'sheet-cellule': () => $localize`:@@coursRuntimeSheetCellule:Cellule`,
  'sheet-recopier': () => $localize`:@@coursRuntimeSheetRecopier:Recopier vers le bas`,
  'sheet-recopie-impossible': () =>
    $localize`:@@coursRuntimeSheetRecopieImpossible:Aucune cellule sous celle-ci : la recopie n’a rien où aller`,
  'sheet-cellule-fautive': () =>
    $localize`:@@coursRuntimeSheetCelluleFautive:Formule refusée par le tableur`,
  'sheet-erreurs': () => $localize`:@@coursRuntimeSheetErreurs:Formules à revoir :`,
  'sheet-aucune-formule': () =>
    $localize`:@@coursRuntimeSheetAucuneFormule:Écrivez au moins une formule avant de valider`,
  'sheet-progression': () => $localize`:@@coursRuntimeSheetProgression:Formules écrites :`,
  'sheet-vide': () =>
    $localize`:@@coursRuntimeSheetVide:Aucune cellule à remplir : le plan ne porte aucune ligne`,
  'cardsort-consigne': () =>
    $localize`:@@coursRuntimeCardsortConsigne:Choisissez une carte, désignez sa catégorie, puis déplacez-la — à la souris comme au clavier`,
  'cardsort-pioche': () => $localize`:@@coursRuntimeCardsortPioche:Cartes à trier`,
  'cardsort-destination': () =>
    $localize`:@@coursRuntimeCardsortDestination:Catégorie de destination`,
  'cardsort-deplacer': () => $localize`:@@coursRuntimeCardsortDeplacer:Déplacer la carte`,
  'cardsort-selection': () => $localize`:@@coursRuntimeCardsortSelection:Carte choisie :`,
  'cardsort-relachee': () =>
    $localize`:@@coursRuntimeCardsortRelachee:Carte relâchée : aucune carte n’est choisie`,
  'cardsort-deplacee': () => $localize`:@@coursRuntimeCardsortDeplacee:déplacée vers`,
  'cardsort-aucune-carte': () =>
    $localize`:@@coursRuntimeCardsortAucuneCarte:Choisissez d’abord une carte à déplacer`,
  'cardsort-hors-cible': () =>
    $localize`:@@coursRuntimeCardsortHorsCible:Dépôt hors d’une catégorie : la carte est revenue à sa place`,
  'cardsort-incomplet': () =>
    $localize`:@@coursRuntimeCardsortIncomplet:Placez chaque carte dans une catégorie avant de valider`,
  'cardsort-progression': () => $localize`:@@coursRuntimeCardsortProgression:Cartes placées :`,
  'cardsort-vide': () =>
    $localize`:@@coursRuntimeCardsortVide:Aucune carte à trier : le plan ne porte aucune carte`,
  'escape-consigne': () =>
    $localize`:@@coursRuntimeEscapeConsigne:Résolvez une énigme pour ouvrir la suivante : chaque réponse juste livre un fragment du code`,
  'escape-progression': () => $localize`:@@coursRuntimeEscapeProgression:Énigmes résolues :`,
  'escape-minuteur': () => $localize`:@@coursRuntimeEscapeMinuteur:Temps passé sur cette énigme :`,
  'escape-minuteur-annonce': () =>
    $localize`:@@coursRuntimeEscapeMinuteurAnnonce:minutes annoncées`,
  'escape-echu': () =>
    $localize`:@@coursRuntimeEscapeEchu:Le temps annoncé est écoulé : rien ne se ferme, prenez le temps qu’il faut`,
  'escape-vide': () => $localize`:@@coursRuntimeEscapeVide:Aucune énigme dans ce parcours`,
  'escape-etat-resolue': () => $localize`:@@coursRuntimeEscapeEtatResolue:Résolue`,
  'escape-etat-ouverte': () => $localize`:@@coursRuntimeEscapeEtatOuverte:Ouverte`,
  'escape-etat-verrouillee': () => $localize`:@@coursRuntimeEscapeEtatVerrouillee:Verrouillée`,
  'escape-verrouillee': () =>
    $localize`:@@coursRuntimeEscapeVerrouillee:Verrouillée : l’énigme précédente l’ouvrira`,
  'escape-fragment': () => $localize`:@@coursRuntimeEscapeFragment:Fragment du code obtenu :`,
  'escape-reponse': () => $localize`:@@coursRuntimeEscapeReponse:Votre réponse`,
  'escape-repondre': () => $localize`:@@coursRuntimeEscapeRepondre:Proposer cette réponse`,
  'escape-reponse-vide': () =>
    $localize`:@@coursRuntimeEscapeReponseVide:Écrivez une réponse avant de la proposer`,
  'escape-a-chercher': () =>
    $localize`:@@coursRuntimeEscapeAChercher:Ce n’est pas encore cela : relisez l’énoncé et proposez autre chose`,
  'escape-indice': () => $localize`:@@coursRuntimeEscapeIndice:Demander un indice`,
  'escape-indice-gratuit': () =>
    $localize`:@@coursRuntimeEscapeIndiceGratuit:Prendre un indice ne retire rien à votre parcours`,
  'escape-indice-attente': () =>
    $localize`:@@coursRuntimeEscapeIndiceAttente:L’indice s’ouvre dans`,
  'escape-secondes': () => $localize`:@@coursRuntimeEscapeSecondes:secondes`,
  'escape-indice-pris': () =>
    $localize`:@@coursRuntimeEscapeIndicePris:Indice ouvert : il ne retire rien à votre parcours`,
  'escape-indice-donne': () => $localize`:@@coursRuntimeEscapeIndiceDonne:Indice :`,
  'escape-debloquee': () =>
    $localize`:@@coursRuntimeEscapeDebloquee:Énigme suivante déverrouillée :`,
  'escape-termine': () =>
    $localize`:@@coursRuntimeEscapeTermine:Toutes les énigmes sont résolues, le code est reconstitué :`,
  'escape-code': () => $localize`:@@coursRuntimeEscapeCode:Code final :`,
  'spaced-consigne': () =>
    $localize`:@@coursRuntimeSpacedConsigne:Rappel : quelques questions sur ce que vous avez travaillé plus tôt, de mémoire, sans vos notes`,
  'spaced-progression': () => $localize`:@@coursRuntimeSpacedProgression:Question`,
  'spaced-origine': () => $localize`:@@coursRuntimeSpacedOrigine:Vu en`,
  'spaced-boite': () => $localize`:@@coursRuntimeSpacedBoite:Boîte`,
  'spaced-vide': () => $localize`:@@coursRuntimeSpacedVide:Rien à revoir pour l’instant`,
  'spaced-erreur': () =>
    $localize`:@@coursRuntimeSpacedErreur:Les questions à revoir ne sont pas arrivées : réessayez dans un instant, rien n’est perdu`,
  'spaced-termine': () =>
    $localize`:@@coursRuntimeSpacedTermine:Révision terminée : vos réponses sont parties`,
  'spaced-diagnostics': () => $localize`:@@coursRuntimeSpacedDiagnostics:Confusions visées :`,
  'verdict-juste': () => $localize`:@@coursRuntimeVerdictJuste:Juste`,
  'verdict-a-revoir': () => $localize`:@@coursRuntimeVerdictARevoir:À revoir`,
  'verdict-score': () => $localize`:@@coursRuntimeVerdictScore:Score :`,
  'sheet-verdict': () => $localize`:@@coursRuntimeSheetVerdict:Cellules justes :`,
  'cardsort-verdict': () => $localize`:@@coursRuntimeCardsortVerdict:Cartes bien placées :`,
  'table-build-verdict': () => $localize`:@@coursRuntimeTableBuildVerdict:Lignes justes :`,
  'table-build-synthese': () => $localize`:@@coursRuntimeTableBuildSynthese:Synthèse`,
  'cardsort-chrono': () => $localize`:@@coursRuntimeCardsortChrono:Temps restant :`,
  'cardsort-chrono-echu': () =>
    $localize`:@@coursRuntimeCardsortChronoEchu:Le temps est écoulé : vous pouvez encore envoyer`,
  'escape-tentatives-restantes': () =>
    $localize`:@@coursRuntimeEscapeTentativesRestantes:Tentatives restantes :`,
  'escape-tentatives-epuisees': () =>
    $localize`:@@coursRuntimeEscapeTentativesEpuisees:Tentatives épuisées : l’énigme suivante s’ouvre, sans fragment`,
  'challenge-attente-revelation': () =>
    $localize`:@@coursRuntimeChallengeAttenteRevelation:Les pistes fausses seront signalées à la révélation`,
  'vote-phase-vote': () => $localize`:@@coursRuntimeVotePhaseVote:Votez seul·e, sans en parler`,
  'vote-phase-revele': () => $localize`:@@coursRuntimeVotePhaseRevele:Réponse révélée`,
  'vote-phase-fermee': () =>
    $localize`:@@coursRuntimeVotePhaseFermee:Le vote est fermé pour cette question`,
  'deja-repondu': () =>
    $localize`:@@coursRuntimeDejaRepondu:Réponse déjà enregistrée : voici votre verdict`,
  'ecran-non-servi': () =>
    $localize`:@@coursRuntimeEcranNonServi:Cet écran n’est pas encore ouvert`,
  apercu: () => $localize`:@@coursRuntimeApercu:Aperçu : les réponses s’envoient pendant la séance`,
  'ecran-verrouille': () => $localize`:@@coursRuntimeEcranVerrouille:Disponible pendant la séance`,
  'video-sous-titres': () => $localize`:@@coursRuntimeVideoSousTitres:Sous-titres`,
  'video-transcription': () => $localize`:@@coursRuntimeVideoTranscription:Transcription`,
  'spaced-carte-maitrise': () =>
    $localize`:@@coursRuntimeSpacedCarteMaitrise:Carte de maîtrise par concept`,
  'spaced-non-vus': () => $localize`:@@coursRuntimeSpacedNonVus:Non vus`,
  'pulse-masque': () =>
    $localize`:@@coursRuntimePulseMasque:Comptes affichés à partir de 5 réponses`,
  'production-vide': () =>
    $localize`:@@coursRuntimeProductionVide:Saisissez au moins une valeur ou choisissez « Je ne sais pas »`,
  'brouillon-restaure': () => $localize`:@@coursRuntimeBrouillonRestaure:Brouillon restauré`,
  'plot-voir-donnees': () => $localize`:@@coursRuntimePlotVoirDonnees:Voir les données`,
  'tentatives-reseau': () =>
    $localize`:@@coursRuntimeTentativesReseau:Tentative non envoyée : vérifiez la connexion et proposez-la de nouveau`,
  'story-source-visuel': () => $localize`:@@coursRuntimeStorySourceVisuel:Source du visuel`,
  'story-source-media': () => $localize`:@@coursRuntimeStorySourceMedia:Source du média`,
  'duree-minutes': () => $localize`:@@coursRuntimeDureeMinutes:min`,
  'modalite-solo': () => $localize`:@@coursRuntimeModaliteSolo:Individuel`,
  'modalite-binome': () => $localize`:@@coursRuntimeModaliteBinome:En binôme`,
  'modalite-groupe': () => $localize`:@@coursRuntimeModaliteGroupe:En groupe`,
  'modalite-classe': () => $localize`:@@coursRuntimeModaliteClasse:Classe entière`,
  'regime-ouvert': () => $localize`:@@coursRuntimeRegimeOuvert:Régime ouvert`,
  'regime-focus': () => $localize`:@@coursRuntimeRegimeFocus:Régime concentré`,
  'regime-examen': () => $localize`:@@coursRuntimeRegimeExamen:Régime d’examen`,
};

export function texte(cle: string): string {
  return Object.hasOwn(LIBELLES, cle) ? LIBELLES[cle]() : cle;
}
