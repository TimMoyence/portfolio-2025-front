export const concept4 = `
:where(.fp-root) .fp-concept4__atelier {
  display: grid;
  gap: var(--fp-s-4);
}

:where(.fp-root) .fp-concept4__reglages {
  display: grid;
  gap: var(--fp-s-3);
  width: 100%;
}

:where(.fp-root) .fp-concept4__reglages > legend {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-texte-fort);
  font-size: calc(1.1rem * var(--fp-echelle));
}

:where(.fp-root) .fp-concept4__parametre {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--fp-s-1) var(--fp-s-2);
}

:where(.fp-root) .fp-concept4__etiquette {
  grid-column: 1 / -1;
  color: var(--fp-texte-fort);
  font-weight: 600;
}

:where(.fp-root) .fp-concept4__animation:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 4px;
}

:where(.fp-root) .fp-concept4__animation {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

:where(.fp-root) .fp-concept4__animation:hover {
  background: var(--fp-teal-ink);
}

:where(.fp-root) .fp-concept4__parametres {
  display: grid;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-concept4__valeur {
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-mono);
  font-weight: 600;
}

:where(.fp-root) .fp-concept4__curseur {
  width: 100%;
  min-height: 44px;
  accent-color: var(--fp-teal-deep);
}

:where(.fp-root) .fp-concept4__faces {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: var(--fp-s-3);
  width: 100%;
}

:where(.fp-root) .fp-concept4__face {
  display: grid;
  align-content: start;
  gap: var(--fp-s-2);
  min-width: 0;
}

:where(.fp-root) .fp-concept4__intitule {
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:where(.fp-root) .fp-concept4__formule {
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-size: calc(1.05rem * var(--fp-echelle));
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-concept4__terme {
  border-radius: var(--fp-r-sm);
  padding: 0 var(--fp-s-1);
}

:where(.fp-root) .fp-concept4__terme[data-actif='true'] {
  background: var(--fp-gold);
  color: var(--fp-ink);
  font-weight: 700;
}

:where(.fp-root) .fp-concept4__fraction {
  display: inline-grid;
  grid-template-rows: auto auto;
  margin-inline: 0.2em;
  line-height: 1.05;
  text-align: center;
  vertical-align: middle;
}

:where(.fp-root) .fp-concept4__fraction-numerateur {
  padding-inline: 0.2em;
  border-bottom: 1px solid currentColor;
}

:where(.fp-root) .fp-concept4__fraction-denominateur {
  padding-inline: 0.2em;
}

:where(.fp-root) .fp-concept4__resultat {
  color: var(--fp-teal-ink);
  font-weight: 700;
}

:where(.fp-root) .fp-concept4__courbe {
  width: 100%;
  height: auto;
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
}

:where(.fp-root) .fp-concept4__trace {
  fill: none;
  stroke: var(--fp-teal-deep);
  stroke-width: 2.5;
  stroke-linejoin: round;
}

:where(.fp-root) .fp-concept4__point {
  fill: var(--fp-gold-deep);
  stroke: var(--fp-cream);
  stroke-width: 2;
}

:where(.fp-root) .fp-concept4__tableau {
  border-collapse: collapse;
  width: 100%;
}

:where(.fp-root) .fp-concept4__tableau th,
:where(.fp-root) .fp-concept4__tableau td {
  padding: var(--fp-s-1) var(--fp-s-2);
  border-bottom: 1px solid var(--fp-bordure);
  text-align: right;
}

:where(.fp-root) .fp-concept4__tableau th {
  color: var(--fp-texte-fort);
  font-size: calc(0.85rem * var(--fp-echelle));
}

:where(.fp-root) .fp-concept4__ligne[data-courant='true'] {
  background: var(--fp-a-revoir-fond);
  color: var(--fp-texte-fort);
  font-weight: 700;
}

:where(.fp-root) .fp-concept4__phrase {
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-concept4__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-concept4__zone {
  display: grid;
  gap: var(--fp-s-3);
}
`;
