export const worked = `
:where(.fp-root) .fp-worked__exemple {
  display: grid;
  justify-items: stretch;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-worked__enonce {
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-display);
  font-size: calc(1.45rem * var(--fp-echelle));
  line-height: 1.25;
}

:where(.fp-root) .fp-worked__consigne {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-teal-deep);
  border-radius: var(--fp-r-sm);
  background: var(--fp-confirme-fond);
  color: var(--fp-confirme);
}

:where(.fp-root) .fp-worked__etapes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: var(--fp-s-2);
  padding: 0;
  list-style: none;
}

:where(.fp-root) .fp-worked__etape {
  display: grid;
  gap: var(--fp-s-2);
  padding: var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
}

:where(.fp-root) .fp-worked__etape[data-resolue='false'] {
  border-style: dashed;
  background: var(--fp-a-revoir-fond);
}

:where(.fp-root) .fp-worked__intitule {
  color: var(--fp-texte-fort);
  font-weight: 700;
}

:where(.fp-root) .fp-worked__raisonnement {
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-worked__demande {
  color: var(--fp-a-revoir);
  font-weight: 600;
}

:where(.fp-root) .fp-worked__invite {
  color: var(--fp-teal-ink);
  font-style: italic;
}

:where(.fp-root) .fp-worked__champ {
  width: 100%;
  padding: var(--fp-s-2);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  background: var(--fp-surface);
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-sans);
  font-size: var(--fp-corps);
  line-height: 1.5;
  resize: vertical;
}

:where(.fp-root) .fp-worked__champ:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-worked__champ:disabled {
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
}

:where(.fp-root) .fp-worked__reponse {
  min-height: calc(var(--fp-corps) * 1.5 + 2 * var(--fp-s-2));
  padding: var(--fp-s-2);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r-sm);
  background: var(--fp-en-attente-fond);
  color: var(--fp-texte-fort);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

:where(.fp-root) .fp-worked__valider {
  justify-self: start;
  padding: var(--fp-s-2) var(--fp-s-4);
  border: 1px solid var(--fp-teal-deep);
  border-radius: var(--fp-r-pill);
  background: var(--fp-teal-deep);
  color: var(--fp-cream);
  font-weight: 600;
  cursor: pointer;
}

:where(.fp-root) .fp-worked__valider:disabled {
  border-color: var(--fp-bordure);
  background: var(--fp-en-attente-fond);
  color: var(--fp-en-attente);
  cursor: not-allowed;
}

:where(.fp-root) .fp-worked__retour {
  min-height: calc(1.5rem * var(--fp-echelle));
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-worked__suite {
  color: var(--fp-en-attente);
  font-style: italic;
}

:where(.fp-root) .fp-worked__niveau {
  color: var(--fp-ink-mute);
  font-family: var(--fp-font-mono);
  letter-spacing: 0.02em;
}
`;
