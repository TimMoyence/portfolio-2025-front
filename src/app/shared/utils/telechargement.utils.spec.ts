import { telechargerFichier } from './telechargement.utils';

describe('telechargerFichier', () => {
  it('fait telecharger le contenu sous le nom et le type demandes puis libere l URL', () => {
    const creation = spyOn(URL, 'createObjectURL').and.returnValue('blob:bilan');
    const liberation = spyOn(URL, 'revokeObjectURL');
    const clic = spyOn(HTMLAnchorElement.prototype, 'click');

    telechargerFichier(document, '{"code":"4821"}', 'bilan.json', 'application/json');

    const fichier = creation.calls.mostRecent().args[0] as Blob;
    const lien = clic.calls.mostRecent().object as HTMLAnchorElement;
    expect(fichier.type).toBe('application/json');
    expect(lien.download).toBe('bilan.json');
    expect(liberation).toHaveBeenCalledOnceWith('blob:bilan');
  });

  it('ne fait rien sans fenetre, comme lors du rendu serveur', () => {
    const clic = spyOn(HTMLAnchorElement.prototype, 'click');
    const sansFenetre = document.implementation.createHTMLDocument('serveur');

    telechargerFichier(sansFenetre, 'contenu', 'fichier.txt', 'text/plain');

    expect(sansFenetre.defaultView).toBeNull();
    expect(clic).not.toHaveBeenCalled();
  });
});
