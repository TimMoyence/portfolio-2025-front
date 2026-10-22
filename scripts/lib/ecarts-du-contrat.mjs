export function ecartsDeLaCopieDeTravail(porcelaine) {
  return porcelaine
    .split('\n')
    .filter((ligne) => ligne.length > 3 && (ligne.startsWith('??') || ligne[1] !== ' '));
}
