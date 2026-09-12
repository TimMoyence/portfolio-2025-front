export const vote = `
:where(.fp-root) .fp-option {
  display: flex;
  align-items: center;
  gap: var(--fp-s-2);
  width: 100%;
  padding: var(--fp-s-3) var(--fp-s-4);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  color: var(--fp-texte);
  font-size: var(--fp-corps);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s var(--fp-ease), background-color 0.2s var(--fp-ease);
}

:where(.fp-root) .fp-option:hover {
  border-color: var(--fp-teal);
}

:where(.fp-root) .fp-option:focus-visible {
  outline: 2px solid var(--fp-teal);
  outline-offset: 2px;
}

:where(.fp-root) .fp-option--neutre {
  color: var(--fp-en-attente);
  background: var(--fp-en-attente-fond);
  border-style: dashed;
}

:where(.fp-root) .fp-verdict {
  font-size: var(--fp-titre);
  font-weight: 600;
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-histogramme {
  display: grid;
  grid-template-columns: minmax(6ch, 26%) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--fp-s-2);
  width: 100%;
}

:where(.fp-root) .fp-barre {
  display: contents;
}

:where(.fp-root) .fp-barre__libelle {
  color: var(--fp-texte-fort);
  font-weight: 600;
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-barre__piste {
  display: block;
  height: var(--fp-s-3);
  border-radius: var(--fp-r-pill);
  background: var(--fp-piste);
  overflow: hidden;
}

:where(.fp-root) .fp-barre__valeur {
  display: block;
  height: 100%;
  min-width: 2px;
  border-radius: inherit;
  background: var(--fp-remplissage);
}

:where(.fp-root) .fp-barre__pourcentage {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--fp-texte-fort);
}

@media (max-width: 520px) {
  :where(.fp-root) .fp-histogramme {
    grid-template-columns: minmax(0, 1fr);
  }

  :where(.fp-root) .fp-barre {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--fp-s-2);
  }

  :where(.fp-root) .fp-barre__piste {
    grid-column: 1 / -1;
  }
}
`;
