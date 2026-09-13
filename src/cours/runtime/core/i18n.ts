const FR: Readonly<Record<string, string>> = {
  valider: 'Valider',
  suivant: 'Suivant',
  precedent: 'Précédent',
  'je-ne-sais-pas': 'Je ne sais pas',
  'en-attente': 'En attente de votre réponse',
  'reponse-enregistree': 'Réponse enregistrée',
  'saisie-non-numerique': 'Saisissez un nombre — la virgule décimale est acceptée',
  'a-revoir': 'Pas encore — regardons pourquoi',
  confirme: 'C’est juste',
  'discussion-en-cours': 'Discutez avec votre voisin',
  revoter: 'Voter à nouveau',
  envoyer: 'Envoyer',
  'rappel-consigne': 'Écrivez tout ce dont vous vous souvenez, sans regarder vos notes',
  'rappel-restant': 'Options disponibles dans',
  'rappel-termine': 'Options disponibles',
  'choix-obligatoire': 'Choisissez une réponse avant d’envoyer',
  'texte-libre-trop-long': 'Réduisez votre réponse à',
  'caracteres-maximum': 'caractères maximum',
  chargement: 'Chargement…',
  'hors-ligne': 'Hors ligne — vos réponses seront envoyées à la reconnexion',
};

export function texte(cle: string): string {
  return FR[cle] ?? cle;
}
