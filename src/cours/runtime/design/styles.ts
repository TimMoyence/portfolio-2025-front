export const tokens = `
:where(.fp-root) {
  --fp-cream: #fffaf2;
  --fp-ivory: #fbf3e6;
  --fp-sand: #f1e7d6;
  --fp-line: #e4d8c4;

  --fp-ink: #0c0902;
  --fp-ink-soft: #3c3529;
  --fp-ink-mute: #756c5d;

  --fp-teal: #4fb3a2;
  --fp-teal-deep: #2f8a78;
  --fp-teal-ink: #1c5a50;
  --fp-gold: #e6aa46;
  --fp-gold-deep: #b8822c;
  --fp-gold-ink: #8a5f14;

  --fp-confirme: var(--fp-teal-ink);
  --fp-confirme-fond: #eaf6f3;
  --fp-a-revoir: var(--fp-gold-ink);
  --fp-a-revoir-fond: #fdf4e3;
  --fp-en-cours: var(--fp-ink-soft);
  --fp-en-cours-fond: var(--fp-sand);
  --fp-en-attente: var(--fp-ink-mute);
  --fp-en-attente-fond: var(--fp-cream);
  --fp-erreur: #c0563c;
  --fp-juste: #2e7d4f;

  --fp-font-display: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --fp-font-sans: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
  --fp-font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;

  --fp-s-1: 6px;
  --fp-s-2: 12px;
  --fp-s-3: 20px;
  --fp-s-4: 32px;
  --fp-s-5: 52px;
  --fp-s-6: 84px;

  --fp-r-sm: 8px;
  --fp-r: 12px;
  --fp-r-lg: 20px;
  --fp-r-pill: 999px;

  --fp-shadow-card: 0 4px 14px rgba(28, 22, 10, 0.06), 0 22px 50px rgba(28, 22, 10, 0.09);
  --fp-ease: cubic-bezier(0.22, 1, 0.36, 1);

  --fp-echelle: 1;
  --fp-corps: calc(1rem * var(--fp-echelle));
  --fp-titre: calc(2rem * var(--fp-echelle));

  --fp-fond: var(--fp-cream);
  --fp-surface: #ffffff;
  --fp-texte: var(--fp-ink-soft);
  --fp-texte-fort: var(--fp-ink);
  --fp-bordure: var(--fp-line);

  --fp-piste: var(--fp-sand);
  --fp-remplissage: var(--fp-teal-deep);
}
`;

export const base = `
:where(.fp-root) {
  box-sizing: border-box;
}

:where(.fp-root) *,
:where(.fp-root) *::before,
:where(.fp-root) *::after {
  box-sizing: inherit;
  margin: 0;
  padding: 0;
}

:where(.fp-root) {
  color: var(--fp-texte);
  background: var(--fp-fond);
  font-family: var(--fp-font-sans);
  font-size: var(--fp-corps);
  line-height: 1.5;
}

:where(.fp-root) img,
:where(.fp-root) svg,
:where(.fp-root) video {
  display: block;
  max-width: 100%;
}

:where(.fp-root) h1,
:where(.fp-root) h2,
:where(.fp-root) h3 {
  font-family: var(--fp-font-display);
  color: var(--fp-texte-fort);
  font-weight: 400;
  line-height: 1.2;
}

:where(.fp-root) button {
  font: inherit;
  color: inherit;
}

:where(.fp-root) {
  --fp-gouttiere: clamp(20px, calc(0.5rem + 3.3333cqi), 72px);
  --fp-respiration: clamp(32px, calc(1.25rem + 3.3333cqi), 84px);
}

:where(.fp-root) .fp-grille {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--fp-gouttiere);
  width: 100%;
  max-width: 1920px;
  margin-inline: auto;
  padding: var(--fp-respiration) var(--fp-gouttiere);
}

@media (prefers-reduced-motion: reduce) {
  :where(.fp-root) *,
  :where(.fp-root) *::before,
  :where(.fp-root) *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

:where(.fp-root) .fp-carte {
  background: var(--fp-surface);
  border: 1px solid var(--fp-bordure);
  border-radius: var(--fp-r-lg);
  box-shadow: var(--fp-shadow-card);
  padding: var(--fp-s-4);
}

:where(.fp-root) .fp-scene {
  display: grid;
  gap: var(--fp-s-4);
}

:where(.fp-root) .fp-enonce {
  font-family: var(--fp-font-display);
  font-size: var(--fp-titre);
  line-height: 1.2;
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--fp-s-1) var(--fp-s-2);
  border-radius: var(--fp-r-pill);
  font-size: 0.75em;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: var(--fp-sand);
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-encadre {
  border: 1px solid var(--fp-bordure);
  border-left-width: var(--fp-s-1);
  border-radius: var(--fp-r);
  padding: var(--fp-s-3);
  background: var(--fp-ivory);
}

:where(.fp-root) [data-etat='confirme'] {
  color: var(--fp-confirme);
  background: var(--fp-confirme-fond);
  border-color: var(--fp-confirme);
}

:where(.fp-root) [data-etat='a-revoir'] {
  color: var(--fp-a-revoir);
  background: var(--fp-a-revoir-fond);
  border-color: var(--fp-a-revoir);
}

:where(.fp-root) [data-etat='en-cours'] {
  color: var(--fp-en-cours);
  background: var(--fp-en-cours-fond);
  border-color: var(--fp-en-cours);
}

:where(.fp-root) [data-etat='en-attente'] {
  color: var(--fp-en-attente);
  background: var(--fp-en-attente-fond);
  border-color: var(--fp-en-attente);
}

:where(.fp-root) .fp-montant {
  font-variant-numeric: tabular-nums;
}

:where(.fp-root) .fp-prose {
  max-width: 62ch;
  color: var(--fp-texte);
  font-size: var(--fp-corps);
  line-height: 1.65;
}

:where(.fp-root) .fp-reperes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-1);
}

:where(.fp-root) .fp-verdict {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fp-s-1) var(--fp-s-2);
  align-items: baseline;
  padding: var(--fp-s-2) var(--fp-s-3);
  border: 1px solid var(--fp-bordure);
  border-left-width: var(--fp-s-1);
  border-radius: var(--fp-r);
}

:where(.fp-root) .fp-verdict__confusion {
  font-size: 0.9em;
}

:where(.fp-root) .fp-alerte {
  padding: var(--fp-s-2) var(--fp-s-3);
  border-left: var(--fp-s-1) solid var(--fp-erreur);
  border-radius: var(--fp-r-sm);
  background: var(--fp-a-revoir-fond);
  color: var(--fp-texte-fort);
}

:where(.fp-root) .fp-annonce {
  color: var(--fp-texte);
  font-size: 0.92em;
}

:where(.fp-root) .fp-bouton-neutre {
  justify-self: start;
  min-height: 44px;
  padding: var(--fp-s-1) var(--fp-s-3);
  border: 1px dashed var(--fp-bordure);
  border-radius: var(--fp-r-pill);
  background: transparent;
  cursor: pointer;
}

:where(.fp-root) .fp-bouton-neutre:disabled {
  cursor: default;
  opacity: 0.6;
}
`;

export const stage = `
:where(.fp-root[data-render='stage']) {
  --fp-echelle: var(--fp-echelle-scene, 1.25);
}

:where(.fp-root[data-render='stage']) .fp-carte {
  border-width: 1px;
}
`;
