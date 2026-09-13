export const recall = `
:where(.fp-root) .fp-recall__billet {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-recall__billet > legend {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-texte-fort);
  font-size: calc(1.25rem * var(--fp-echelle));
  line-height: 1.3;
}

:where(.fp-root) .fp-recall__consigne {
  color: var(--fp-ink-mute);
  font-size: calc(0.9rem * var(--fp-echelle));
}

:where(.fp-root) .fp-recall__champ {
  width: 100%;
  min-height: calc(6rem * var(--fp-echelle));
  padding: var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-sans);
  font-size: var(--fp-corps);
  line-height: 1.5;
  resize: vertical;
}

:where(.fp-root) .fp-recall__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-recall__compte {
  justify-self: start;
  padding: var(--fp-s-1) var(--fp-s-3);
  border-radius: var(--fp-r-pill);
  background: var(--fp-en-cours-fond);
  color: var(--fp-en-cours);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

:where(.fp-root) .fp-recall__options {
  display: grid;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-recall__option {
  padding: var(--fp-s-3) var(--fp-s-4);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  font-size: var(--fp-corps);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s var(--fp-ease);
}

:where(.fp-root) .fp-recall__option:hover {
  border-color: var(--fp-teal-deep);
}

:where(.fp-root) .fp-recall__option:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-recall__option:disabled {
  color: var(--fp-en-attente);
  cursor: default;
}

:where(.fp-root) .fp-recall__concepts {
  color: var(--fp-ink-mute);
  font-size: calc(0.9rem * var(--fp-echelle));
  letter-spacing: 0.02em;
}
`;
