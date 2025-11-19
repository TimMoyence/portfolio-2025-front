/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    container: {
      center: true,
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
      },
      padding: '1.25rem', // ~5%
    },
    extend: {
      // --------------------
      // COULEURS PRIMITIVES
      // --------------------
      colors: {
        // Neutres (primitives.color.*)
        'neutral-darkest': '#0c0902', // primitives.color.neutral darkest
        'neutral-darker': '#24211b',
        'neutral-dark': '#54524d',
        neutral: '#858480',
        'neutral-light': '#b6b5b3',
        'neutral-lighter': '#dadad9',
        'neutral-lightest': '#f2f2f2',
        white: '#ffffff',

        // Mountain meadow (vert) primitives.color.mountain meadow*
        'mm-lightest': '#e8f4f3',
        'mm-lighter': '#d1eae7',
        'mm-light': '#5fb7ad',
        mm: '#1b998b',
        'mm-dark': '#157a6f',
        'mm-darker': '#0a3d37',
        'mm-darkest': '#082d29',

        // --------------------
        // COLOR SCHEMES
        // --------------------
        // Color scheme 1
        'scheme-background': '#e8f4f3', // mountain meadow lightest
        'scheme-text': '#0c0902', // neutral darkest
        'scheme-border': '#0c090226', // neutral darkest 15% opacity
        'scheme-accent': '#1b998b', // mountain meadow

        // Color scheme 2/3 si tu en as besoin plus tard :
        'scheme2-background': '#ffffff',
        'scheme2-text': '#0c0902',
        'scheme3-background': '#f2f2f2',
        'scheme3-text': '#0c0902',
      },

      // --------------------
      // TYPO / FONT SIZES
      // (génère text-h1, text-h2, text-medium, etc.)
      // --------------------
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'serif'],
        body: ['"Merriweather Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['4.5rem', { lineHeight: '1.2', letterSpacing: '-0.72px' }],
        h2: ['3.25rem', { lineHeight: '1.2', letterSpacing: '-0.52px' }],
        h6: ['1.375rem', { lineHeight: '1.4', letterSpacing: '-0.22px' }],
        medium: ['1.125rem', { lineHeight: '1.5' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
      },

      // --------------------
      // RADIUS
      // (rounded-card, rounded-form, rounded-image, etc.)
      // --------------------
      borderRadius: {
        card: '0.5rem', // 8px
        form: '0.5rem',
        image: '0.75rem',
        button: '9999px', // pill
      },

      // --------------------
      // SPACING / HEIGHTS
      // --------------------
      spacing: {
        18: '4.5rem', // 72px => pour h-18, min-h-18
      },

      // Optionnel : ombres issues de effect.medium, etc. :contentReference[oaicite:2]{index=2}
      boxShadow: {
        xxs: '0 1px 2px 0 #0000000d',
        xs: '0 1px 2px 0 #0000000f, 0 1px 3px 0 #0000001a',
        sm: '0 2px 4px -2px #0000000f, 0 4px 8px -2px #0000001a',
        md: '0 4px 6px -2px #00000008, 0 12px 16px -4px #00000014',
      },
    },
  },
  plugins: [],
};
