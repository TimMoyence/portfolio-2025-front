function epaisseurHorsTexte(zone: HTMLTextAreaElement): number {
  const style = getComputedStyle(zone);
  return style.boxSizing === 'border-box'
    ? zone.offsetHeight - zone.clientHeight
    : -(Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom));
}

export function suivreLesZonesDeSaisie(racine: ParentNode): () => void {
  const arrets = [...racine.querySelectorAll('textarea')].map((zone) => suivreLaSaisie(zone));
  return () => {
    arrets.forEach((arreter) => {
      arreter();
    });
  };
}

export function suivreLaSaisie(zone: HTMLTextAreaElement): () => void {
  let largeur = -1;
  const ajuster = (): void => {
    if (zone.clientWidth === 0) {
      return;
    }
    largeur = zone.clientWidth;
    zone.style.blockSize = 'auto';
    zone.style.blockSize = `${zone.scrollHeight + epaisseurHorsTexte(zone)}px`;
  };
  const observateur =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (!zone.isConnected) {
            arreter();
          } else if (zone.clientWidth !== largeur) {
            requestAnimationFrame(ajuster);
          }
        });
  const apresUnePolice = (): void => (zone.isConnected ? ajuster() : arreter());
  function arreter(): void {
    zone.removeEventListener('input', ajuster);
    document.fonts.removeEventListener('loadingdone', apresUnePolice);
    observateur?.disconnect();
  }
  zone.addEventListener('input', ajuster);
  document.fonts.addEventListener('loadingdone', apresUnePolice);
  observateur?.observe(zone);
  ajuster();
  return arreter;
}
