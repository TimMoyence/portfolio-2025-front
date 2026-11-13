import { saisieAntiRobot } from './saisie-anti-robot';

function saisieOuverteA(ouverture: number, lecture: number, piege = '') {
  let maintenant = ouverture;
  spyOn(performance, 'now').and.callFake(() => maintenant);
  const saisie = saisieAntiRobot();
  maintenant = lecture;
  saisie.website.set(piege);
  return saisie.champs();
}

describe('saisieAntiRobot', () => {
  it('rend le champ piege saisi et la duree de saisie mesuree depuis l ouverture', () => {
    expect(saisieOuverteA(1_000, 5_200.4, 'robot.example')).toEqual({
      website: 'robot.example',
      formFillDurationMs: 4200,
    });
  });

  it('ne rend jamais une duree negative quand l horloge recule', () => {
    expect(saisieOuverteA(1_000, 900)).toEqual({ website: '', formFillDurationMs: 0 });
  });
});
