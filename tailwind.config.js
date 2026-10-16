/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    container: {
      center: true,
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
      padding: '1rem',
    },
    extend: {
      colors: {
        'scheme-background': 'var(--bg)',
        'scheme-surface': 'var(--surface)',
        'scheme-surface-hover': 'var(--ivory)',
        'scheme-text': 'var(--text-strong)',
        'scheme-text-muted': 'var(--text-mute)',
        'scheme-border': 'var(--border)',
        'scheme-accent': 'var(--accent)',
        'scheme-accent-hover': 'var(--teal-deep)',
        'scheme-accent-active': 'var(--teal-ink)',
        'scheme-accent-focus': '#4fb3a233',
        'scheme-on-accent': 'var(--on-accent)',
      },
      fontFamily: {
        display: ['"Instrument Serif"', '"Indices Serif"', 'Georgia', 'serif'],
        heading: ['"Instrument Serif"', '"Indices Serif"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', '"Indices Serif"', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', '"Indices Serif"', 'monospace'],
      },
      fontSize: {
        h2: ['2.5rem', { lineHeight: '1.18', letterSpacing: '-0.04em' }],
        h3: ['2.125rem', { lineHeight: '1.22', letterSpacing: '-0.03em' }],
        h4: ['1.75rem', { lineHeight: '1.28', letterSpacing: '-0.02em' }],
        medium: ['1.25rem', { lineHeight: '1.65' }],
        small: ['1rem', { lineHeight: '1.65' }],
      },
      borderRadius: {
        form: '0.5rem',
        button: '9999px',
      },
      spacing: { 18: '4.5rem' },
      boxShadow: {
        sm: '0 2px 4px -2px #0000000f, 0 4px 8px -2px #0000001a',
      },
    },
  },
  plugins: [],
};
