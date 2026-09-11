const FR: Readonly<Record<string, string>> = {
  valider: 'Valider',
  suivant: 'Suivant',
  precedent: 'Précédent',
  'je-ne-sais-pas': 'Je ne sais pas',
  'en-attente': 'En attente de votre réponse',
  'reponse-enregistree': 'Réponse enregistrée',
  'a-revoir': 'Pas encore — regardons pourquoi',
  confirme: 'C’est juste',
  'discussion-en-cours': 'Discutez avec votre voisin',
  revoter: 'Voter à nouveau',
  chargement: 'Chargement…',
  'hors-ligne': 'Hors ligne — vos réponses seront envoyées à la reconnexion',
};

export function texte(cle: string): string {
  return FR[cle] ?? cle;
}
