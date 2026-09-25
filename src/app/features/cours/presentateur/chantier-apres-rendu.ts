import { afterNextRender } from '@angular/core';

export function chantierApresRendu(travail: () => Promise<void>): Promise<void> {
  return new Promise<void>((resoudre) => {
    afterNextRender(() => {
      void travail().then(resoudre);
    });
  });
}
