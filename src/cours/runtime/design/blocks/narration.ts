export const quote = `
:where(.fp-root) .fp-quote__figure {
  display: grid;
  gap: var(--fp-s-3);
  justify-items: start;
}

:where(.fp-root) .fp-quote__texte {
  max-width: 46ch;
  color: var(--fp-texte-fort);
  font-family: var(--fp-font-display);
  font-size: calc(1.5rem * var(--fp-echelle));
  line-height: 1.3;
  text-wrap: balance;
}

:where(.fp-root) .fp-quote__texte::before {
  content: '« ';
}

:where(.fp-root) .fp-quote__texte::after {
  content: ' »';
}

:where(.fp-root) .fp-quote__attribution {
  color: var(--fp-ink-mute);
  font-size: calc(0.95rem * var(--fp-echelle));
  font-style: italic;
  letter-spacing: 0.01em;
}

:where(.fp-root) .fp-quote__attribution::before {
  content: '— ';
}
`;

export const story = `
:where(.fp-root) .fp-story__recit {
  display: grid;
  gap: var(--fp-s-3);
}

:where(.fp-root) .fp-story__titre {
  font-size: calc(1.35rem * var(--fp-echelle));
}

:where(.fp-root) .fp-story__corps {
  display: grid;
  gap: var(--fp-s-2);
}

:where(.fp-root) .fp-story__visuel {
  display: grid;
  gap: var(--fp-s-1);
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--fp-line);
  border-radius: var(--fp-radius);
  background: linear-gradient(135deg, var(--fp-teal-deep), var(--fp-ink));
}

:where(.fp-root) .fp-story__visuel img {
  display: block;
  width: min(8rem, 42%);
  max-height: min(28vh, 11rem);
  margin: var(--fp-s-3) auto 0;
  object-fit: contain;
}

:where(.fp-root) .fp-story__visuel figcaption {
  padding: 0 var(--fp-s-2) var(--fp-s-2);
  color: var(--fp-cream);
  font-family: var(--fp-font-mono);
  font-size: calc(0.68rem * var(--fp-echelle));
}

:where(.fp-root) .fp-story__paragraphe {
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-story__paragraphe:first-child::first-letter {
  float: left;
  padding-right: var(--fp-s-1);
  color: var(--fp-gold-ink);
  font-family: var(--fp-font-display);
  font-size: calc(2.4rem * var(--fp-echelle));
  line-height: 0.8;
}

:where(.fp-root) .fp-story__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}
`;

export const pro = `
:where(.fp-root) .fp-pro__cas {
  display: grid;
  gap: var(--fp-s-3);
  justify-items: start;
}

:where(.fp-root) .fp-pro__metier {
  background: var(--fp-gold-deep);
  color: var(--fp-cream);
  text-transform: uppercase;
}

:where(.fp-root) .fp-pro__corps {
  display: grid;
  gap: var(--fp-s-3);
  width: 100%;
}

:where(.fp-root) .fp-pro__situation {
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-pro__geste {
  display: grid;
  gap: var(--fp-s-1);
  border-left-color: var(--fp-teal-deep);
}

:where(.fp-root) .fp-pro__intitule {
  color: var(--fp-teal-ink);
  font-family: var(--fp-font-sans);
  font-size: calc(0.85rem * var(--fp-echelle));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:where(.fp-root) .fp-pro__geste-texte {
  color: var(--fp-texte-fort);
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-pro__consequence {
  color: var(--fp-ink-mute);
  font-style: italic;
  overflow-wrap: anywhere;
}

:where(.fp-root) .fp-pro__reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-2);
}
`;
