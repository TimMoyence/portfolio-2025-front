export const numeric = `
:where(.fp-root) .fp-numeric__numerique {
  display: grid;
  justify-items: start;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-numeric__numerique > legend {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-texte-fort);
  font-size: calc(1.25rem * var(--fp-echelle));
  line-height: 1.3;
}

:where(.fp-root) .fp-numeric__saisie {
  display: flex;
  align-items: baseline;
  gap: var(--fp-s-2);
  width: 100%;
}

:where(.fp-root) .fp-numeric__champ {
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--fp-s-3) var(--fp-s-4);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-mono);
  font-size: var(--fp-corps);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

:where(.fp-root) .fp-numeric__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-numeric__champ:disabled {
  background: var(--fp-sand);
  color: var(--fp-ink-mute);
}

:where(.fp-root) .fp-numeric__unite {
  flex: 0 0 auto;
  color: var(--fp-texte-fort);
  font-size: var(--fp-corps);
  font-weight: 600;
  white-space: nowrap;
}

:where(.fp-root) .fp-numeric__valider {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-size: var(--fp-corps);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s var(--fp-ease);
}

:where(.fp-root) .fp-numeric__valider:hover {
  background: var(--fp-teal-ink);
}

:where(.fp-root) .fp-numeric__valider:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-numeric__valider:disabled {
  border-color: var(--fp-en-attente);
  background: var(--fp-en-attente);
  cursor: default;
}

@media (max-width: 520px) {
  :where(.fp-root) .fp-numeric__saisie {
    flex-wrap: wrap;
  }

  :where(.fp-root) .fp-numeric__valider {
    justify-self: stretch;
    text-align: center;
  }
}
`;
