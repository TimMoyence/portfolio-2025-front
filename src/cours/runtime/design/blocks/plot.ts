export const plot = `
:where(.fp-root) .fp-plot__atelier {
  display: grid;
  gap: var(--fp-s-4);
}

:where(.fp-root) .fp-plot__reglages {
  display: grid;
  gap: var(--fp-s-3);
  width: 100%;
}

:where(.fp-root) .fp-plot__reglages > legend {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-texte-fort);
  font-size: calc(1.1rem * var(--fp-echelle));
}

:where(.fp-root) .fp-plot__curseur {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--fp-s-1) var(--fp-s-2);
}

:where(.fp-root) .fp-plot__etiquette {
  grid-column: 1 / -1;
  color: var(--fp-texte-fort);
  font-weight: 600;
}

:where(.fp-root) .fp-plot__glissiere {
  width: 100%;
  min-width: 0;
  accent-color: var(--fp-teal-deep);
}

:where(.fp-root) .fp-plot__glissiere:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 4px;
}

:where(.fp-root) .fp-plot__valeur {
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-mono);
  font-weight: 600;
}

:where(.fp-root) .fp-plot__figure {
  display: grid;
  gap: var(--fp-s-2);
  min-width: 0;
}

:where(.fp-root) .fp-plot__graphique {
  width: 100%;
  height: auto;
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
}

:where(.fp-root) .fp-plot__axe {
  stroke: var(--fp-ink-mute);
  stroke-width: 1.5;
}

:where(.fp-root) .fp-plot__graduation {
  fill: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-size: calc(11px * var(--fp-echelle));
}

:where(.fp-root) .fp-plot__trace {
  fill: none;
  stroke: var(--fp-teal-deep);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

:where(.fp-root) .fp-plot__trace[data-trait='tirets'] {
  stroke: var(--fp-gold-deep);
  stroke-dasharray: 7 5;
}

:where(.fp-root) .fp-plot__vide {
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  color: var(--fp-en-attente);
}

:where(.fp-root) .fp-plot__lecture {
  display: grid;
  gap: var(--fp-s-3);
  min-width: 0;
}

:where(.fp-root) .fp-plot__legende {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2) var(--fp-s-4);
  list-style: none;
}

:where(.fp-root) .fp-plot__serie {
  display: flex;
  align-items: center;
  gap: var(--fp-s-2);
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-plot__echantillon {
  display: inline-block;
  width: var(--fp-s-4);
  border-top: 3px solid var(--fp-teal-deep);
}

:where(.fp-root) .fp-plot__serie[data-trait='tirets'] .fp-plot__echantillon {
  border-top-style: dashed;
  border-top-color: var(--fp-gold-deep);
}

:where(.fp-root) .fp-plot__tableau {
  border-collapse: collapse;
  width: 100%;
}

:where(.fp-root) .fp-plot__intitule {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}

:where(.fp-root) .fp-plot__tableau th,
:where(.fp-root) .fp-plot__tableau td {
  padding: var(--fp-s-1) var(--fp-s-2);
  border-bottom: 1px solid var(--fp-bordure);
  text-align: right;
}

:where(.fp-root) .fp-plot__ligne th {
  color: var(--fp-texte-fort);
  text-align: left;
}

:where(.fp-root) .fp-plot__synthese {
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-plot__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}
`;
