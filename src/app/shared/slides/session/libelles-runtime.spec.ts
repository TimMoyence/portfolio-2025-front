import { clearTranslations, loadTranslations } from '@angular/localize';
import { texte } from '../../../../cours/runtime/core/i18n';

describe('libellés des briques runtime', () => {
  afterEach(() => clearTranslations());

  it('rend le libellé français de la source quand aucune traduction n’est chargée', () => {
    expect(texte('valider')).toBe('Valider');
    expect(texte('spaced-consigne')).toBe(
      'Quelques questions sur ce que vous avez travaillé plus tôt.',
    );
    expect(texte('deja-repondu')).toBe('Réponse déjà enregistrée : voici votre verdict');
  });

  it('passe par $localize : une traduction chargée remplace le libellé à l’appel suivant', () => {
    loadTranslations({
      coursRuntimeValider: 'Submit',
      coursRuntimeJeNeSaisPas: 'I don’t know',
      coursRuntimeEcranVerrouille: 'Available during the session',
    });

    expect(texte('valider')).toBe('Submit');
    expect(texte('je-ne-sais-pas')).toBe('I don’t know');
    expect(texte('ecran-verrouille')).toBe('Available during the session');
  });

  it('rend la clé elle-même pour une clé inconnue, sans lever', () => {
    expect(texte('cle-inexistante')).toBe('cle-inexistante');
  });
});
