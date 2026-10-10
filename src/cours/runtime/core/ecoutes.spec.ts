import { abonner, diffuserA, type Ecoute } from './ecoutes';

describe('ecoutes', () => {
  it('diffuse une valeur a chaque ecoute abonnee', () => {
    const ecoutes = new Set<Ecoute<number>>();
    const recues: number[] = [];
    abonner(ecoutes, (valeur) => recues.push(valeur));
    abonner(ecoutes, (valeur) => recues.push(valeur * 10));

    diffuserA(ecoutes, 2);

    expect(recues).toEqual([2, 20]);
  });

  it('rend un desabonnement qui retire la seule ecoute concernee', () => {
    const ecoutes = new Set<Ecoute<string>>();
    const recues: string[] = [];
    const desabonner = abonner(ecoutes, (valeur) => recues.push(`a:${valeur}`));
    abonner(ecoutes, (valeur) => recues.push(`b:${valeur}`));

    desabonner();
    diffuserA(ecoutes, 'x');

    expect(recues).toEqual(['b:x']);
  });
});
