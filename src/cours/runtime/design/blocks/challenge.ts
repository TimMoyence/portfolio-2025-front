export const challenge = `
:where(.fp-root) .fp-challenge__probleme {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-challenge__probleme > legend {
  padding-bottom: var(--fp-s-2);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-display);
  font-size: calc(1.45rem * var(--fp-echelle));
  line-height: 1.25;
}

:where(.fp-root) .fp-challenge__rappel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: var(--fp-s-2);
  margin: 0;
  padding: var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
}

:where(.fp-root) .fp-challenge__ligne {
  display: grid;
  gap: calc(var(--fp-s-1) / 2);
}

:where(.fp-root) .fp-challenge__ligne dt {
  color: var(--fp-ink-mute);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 600;
}

:where(.fp-root) .fp-challenge__ligne dd {
  margin: 0;
  color: var(--fp-texte-fort);
  font-size: var(--fp-corps);
  font-variant-numeric: tabular-nums;
}

:where(.fp-root) .fp-challenge__consigne {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-gold-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-a-revoir-fond);
  color: var(--fp-a-revoir);
}

:where(.fp-root) .fp-challenge__invite {
  color: var(--fp-texte-fort);
  font-size: var(--fp-corps);
  font-weight: 600;
}

:where(.fp-root) .fp-challenge__champ {
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

:where(.fp-root) .fp-challenge__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-challenge__envoyer {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-challenge__reveler {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-pill);
  background: var(--fp-surface);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-challenge__reveler:disabled {
  border-style: dashed;
  color: var(--fp-en-attente);
  cursor: not-allowed;
}

:where(.fp-root) .fp-challenge__retour {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-challenge__revelation {
  display: grid;
  gap: var(--fp-s-2);
  padding: var(--fp-s-3);
  border-top: 1px solid var(--fp-bordure);
}

:where(.fp-root) .fp-challenge__titre {
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-display);
  font-size: calc(1.2rem * var(--fp-echelle));
}

:where(.fp-root) .fp-challenge__strategies {
  display: grid;
  gap: var(--fp-s-2);
  list-style: none;
}

:where(.fp-root) .fp-challenge__strategie {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--fp-s-2);
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
}

:where(.fp-root) .fp-challenge__libelle {
  flex: 1 1 12rem;
}

:where(.fp-root) .fp-challenge__marque {
  padding: 0 var(--fp-s-2);
  border: 1px dashed var(--fp-erreur);
  border-radius: var(--fp-r-pill);
  color: var(--fp-erreur);
  font-size: 0.8em;
  font-weight: 700;
  letter-spacing: 0.02em;
}

:where(.fp-root) .fp-challenge__concepts {
  color: var(--fp-ink-mute);
  font-size: calc(0.9rem * var(--fp-echelle));
  letter-spacing: 0.02em;
}

:where(.fp-root) .fp-challenge__attente {
  color: var(--fp-ink-mute);
  font-style: italic;
}
`;
