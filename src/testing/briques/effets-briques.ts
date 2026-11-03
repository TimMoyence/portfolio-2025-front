export interface TracesEffets {
  readonly evenements: string[];
  readonly ecritures: string[];
  restaurer(): void;
}

export function surveillerEffets(hote: HTMLElement): TracesEffets {
  const evenements: string[] = [];
  const ecritures: string[] = [];
  const diffuserOrigine = HTMLElement.prototype.dispatchEvent.bind(hote);
  const ecrireOrigine = Storage.prototype.setItem;
  hote.dispatchEvent = (evenement: Event): boolean => {
    evenements.push(evenement.type);
    return diffuserOrigine(evenement);
  };
  Storage.prototype.setItem = function (cle: string, valeur: string): void {
    ecritures.push(cle);
    ecrireOrigine.call(this, cle, valeur);
  };
  return {
    evenements,
    ecritures,
    restaurer: (): void => {
      Storage.prototype.setItem = ecrireOrigine;
    },
  };
}
