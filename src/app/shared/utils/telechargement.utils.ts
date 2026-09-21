export function telechargerFichier(
  document: Document,
  contenu: string,
  nomDuFichier: string,
  typeMime: string,
): void {
  const fenetre = document.defaultView;
  if (fenetre === null) {
    return;
  }
  const lien = document.createElement('a');
  lien.href = fenetre.URL.createObjectURL(new Blob([contenu], { type: typeMime }));
  lien.download = nomDuFichier;
  lien.click();
  fenetre.URL.revokeObjectURL(lien.href);
}
