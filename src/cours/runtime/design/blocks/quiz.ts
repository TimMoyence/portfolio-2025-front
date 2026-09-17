export const quiz = `
:where(.fp-root) .fp-quiz__atelier {
  display: grid;
  gap: var(--fp-s-4);
}

:where(.fp-root) .fp-quiz__options {
  display: grid;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-quiz__option {
  display: flex;
  align-items: center;
  gap: var(--fp-s-3);
  min-block-size: 58px;
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-surface);
  cursor: pointer;
  text-align: left;
  transition: border-color 160ms var(--fp-ease), transform 160ms var(--fp-ease), background 160ms var(--fp-ease);
}

:where(.fp-root) .fp-quiz__option:hover,
:where(.fp-root) .fp-quiz__option:focus-visible {
  border-color: var(--fp-teal-deep);
  background: var(--fp-confirme-fond);
  transform: translateY(-1px);
}

:where(.fp-root) .fp-quiz__option:disabled {
  cursor: default;
  opacity: 0.68;
}

:where(.fp-root) .fp-quiz__lettre {
  display: grid;
  place-items: center;
  inline-size: 28px;
  block-size: 28px;
  flex: 0 0 28px;
  border-radius: 50%;
  background: var(--fp-sand);
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-mono);
  font-size: 0.8em;
  font-weight: 700;
}

:where(.fp-root) .fp-quiz__retour {
  display: grid;
  gap: var(--fp-s-1);
  padding: var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r);
  background: var(--fp-confirme-fond);
}

:where(.fp-root) .fp-quiz__retour[data-correct='false'] {
  background: var(--fp-a-revoir-fond);
}

:where(.fp-root) .fp-quiz__consigne,
:where(.fp-root) .fp-quiz__indication {
  color: var(--fp-ink-mute);
}
`;
