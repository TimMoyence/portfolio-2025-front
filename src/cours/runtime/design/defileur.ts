import { DEFILEUR_DE_TABLEAU } from '../core/defileur';

const defileur = `.${DEFILEUR_DE_TABLEAU}`;
const enTetesDeLigne = `${defileur} > table > * > tr > :first-child`;
const colonnesFixes = `${enTetesDeLigne}, ${defileur} [data-colonne-fixe]`;
const colonnesFixesApresDefilement = `${defileur}[data-suite-avant] > table > * > tr > :first-child, ${defileur}[data-suite-avant] [data-colonne-fixe]`;

export const defileurDeTableau = `
${defileur} {
  display: grid;
  grid-template-columns: minmax(min-content, 100%);
  min-inline-size: 0;
  max-inline-size: 100%;
  overflow-x: auto;
  container-type: inline-size;
}

${defileur} > * {
  grid-area: 1 / 1;
}

${defileur} > table {
  justify-self: start;
  overflow-wrap: normal;
}

${defileur} > table > caption {
  position: sticky;
  left: 0;
  max-inline-size: 100cqi;
}

${colonnesFixes} {
  position: sticky;
  left: 0;
  z-index: 1;
}

@media screen {
  @container (max-width: 40rem) {
    ${enTetesDeLigne} {
      inline-size: 1%;
    }
  }
}

:where(${colonnesFixesApresDefilement}) {
  background-color: var(--defileur-fond, #ffffff);
}

${colonnesFixesApresDefilement} {
  box-shadow: 0.5rem 0 0.5rem -0.375rem rgba(12, 9, 2, 0.22);
}

${defileur}::after {
  content: '';
  grid-area: 1 / 1;
  justify-self: end;
  position: sticky;
  right: 0;
  z-index: 2;
  inline-size: 1.75rem;
  background: linear-gradient(to left, rgba(12, 9, 2, 0.18), rgba(12, 9, 2, 0));
  opacity: 0;
  pointer-events: none;
}

${defileur}[data-suite-apres]::after {
  opacity: 1;
}

@media print {
  ${defileur} {
    display: block;
    overflow: visible;
    container-type: normal;
  }

  ${defileur}::after {
    content: none;
  }

  ${defileur} > table > caption,
  ${enTetesDeLigne} {
    position: static;
    box-shadow: none;
  }

  ${defileur} [data-colonne-fixe] {
    position: relative;
    box-shadow: none;
  }
}
`;
