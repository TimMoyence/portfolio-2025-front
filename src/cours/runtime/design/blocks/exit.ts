export const exit = `
:where(.fp-root) .fp-exit__billet {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-exit__billet > legend {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-texte-fort);
  font-size: calc(1.25rem * var(--fp-echelle));
  line-height: 1.3;
}

:where(.fp-root) .fp-exit__choix {
  display: grid;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-exit__option {
  padding: var(--fp-s-3) var(--fp-s-4);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  font-size: var(--fp-corps);
  text-align: left;
  cursor: pointer;
}

:where(.fp-root) .fp-exit__option[aria-pressed='true'] {
  border-color: var(--fp-teal-deep);
  background: var(--fp-confirme-fond);
  font-weight: 600;
}

:where(.fp-root) .fp-exit__option:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-exit__invite {
  color: var(--fp-texte-fort);
  font-size: var(--fp-corps);
  font-weight: 600;
}

:where(.fp-root) .fp-exit__champ {
  width: 100%;
  min-height: calc(5rem * var(--fp-echelle));
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

:where(.fp-root) .fp-exit__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-exit__jauge {
  justify-self: end;
  color: var(--fp-ink-mute);
  font-family: var(--fp-font-mono);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-variant-numeric: tabular-nums;
}

:where(.fp-root) .fp-exit__envoyer {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-size: var(--fp-corps);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-exit__envoyer:disabled {
  border-color: var(--fp-en-attente);
  background: var(--fp-en-attente);
  cursor: default;
}

:where(.fp-root) .fp-exit__recap {
  display: grid;
  gap: var(--fp-s-1);
  padding: var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-teal-deep);
  border-radius: var(--fp-r);
  background: var(--fp-ivory);
}

:where(.fp-root) .fp-exit__recap-choix {
  color: var(--fp-texte-fort);
  font-weight: 600;
}

:where(.fp-root) .fp-exit__recap-texte {
  color: var(--fp-texte);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
`;
