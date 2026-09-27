import { lignesDeCalcul } from './lignes-de-calcul';

const FINE = ' ';

describe('lignesDeCalcul : chaque calcul d une correction sur sa propre ligne', () => {
  it('laisse entière une phrase sans calcul', () => {
    expect(
      lignesDeCalcul(
        'Deux évolutions simultanées ne prouvent pas une cause : l’hypothèse de Samir reste à vérifier.',
      ),
    ).toEqual([
      'Deux évolutions simultanées ne prouvent pas une cause : l’hypothèse de Samir reste à vérifier.',
    ]);
  });

  it('écran 58 · pose l annonce, puis chaque calcul, puis la phrase de lecture sur des lignes distinctes', () => {
    expect(
      lignesDeCalcul(
        'Marge de la marketplace : 523 000 × 0,16 = 83 680 €, soit 83 680 ÷ 291 000 ≈ 28,8 % de la marge. 45,5 % est sa part du CA, pas de la marge.',
      ),
    ).toEqual([
      'Marge de la marketplace :',
      `523${FINE}000 × 0,16 = 83${FINE}680 €,`,
      `soit 83${FINE}680 ÷ 291${FINE}000 ≈ 28,8 % de la marge.`,
      '45,5 % est sa part du CA, pas de la marge.',
    ]);
  });

  it('sépare deux calculs qui se suivent dans la même phrase', () => {
    expect(
      lignesDeCalcul(
        'Marge : 20 €. Taux de marque = 20 ÷ 100 = 20 % (sur le prix de vente) ; taux de marge = 20 ÷ 80 = 25 % (sur le coût d’achat), la même hausse qu’au diagnostic.',
      ),
    ).toEqual([
      'Marge : 20 €.',
      'Taux de marque = 20 ÷ 100 = 20 % (sur le prix de vente) ;',
      'taux de marge = 20 ÷ 80 = 25 % (sur le coût d’achat),',
      'la même hausse qu’au diagnostic.',
    ]);
  });

  it('ne coupe jamais à l intérieur d une parenthèse', () => {
    expect(
      lignesDeCalcul(
        'Avec les poids exacts (397 ÷ 1 150 ; 230 ÷ 1 150 ; 523 ÷ 1 150), on obtient 25,304 %.',
      ),
    ).toEqual([
      `Avec les poids exacts (397 ÷ 1${FINE}150 ; 230 ÷ 1${FINE}150 ; 523 ÷ 1${FINE}150),`,
      'on obtient 25,304 %.',
    ]);
  });

  it('colle les milliers d un nombre pour qu un retour à la ligne ne le coupe pas', () => {
    expect(lignesDeCalcul('Contrôle : 1 150 000 × 0,455 ≈ 523 000.')).toEqual([
      'Contrôle :',
      `1${FINE}150${FINE}000 × 0,455 ≈ 523${FINE}000.`,
    ]);
  });
});
