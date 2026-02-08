/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    container: {
      center: true,
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      padding: "1rem", // ~5%
    },
    extend: {
      // --------------------
      // COULEURS PRIMITIVES
      // --------------------
      colors: {
        // --------------------
        // COLOR SCHEME (UI TOKENS)
        // --------------------
        "scheme-background": "#e8f4f3",
        "scheme-surface": "#ffffff",
        "scheme-surface-hover": "#f6fbfa",

        "scheme-text": "#0c0902",
        "scheme-text-muted": "#54524d",

        "scheme-border": "#0c090226",

        "scheme-accent": "#1b998b",
        "scheme-accent-hover": "#157a6f", // mm-dark
        "scheme-accent-active": "#0a3d37", // mm-darker
        "scheme-accent-focus": "#1b998b33", // 20% ring
        "scheme-on-accent": "#ffffff",
      },

      // --------------------
      // TYPO / FONT SIZES
      // (génère text-h1, text-h2, text-medium, etc.)
      // --------------------
      fontFamily: {
        heading: ['"Nunito"', "italic", "system-ui", "sans-serif"],
        body: ['"Merriweather Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["3rem", { lineHeight: "1.15", letterSpacing: "-0.045em" }], // 48px
        h2: ["2.5rem", { lineHeight: "1.18", letterSpacing: "-0.04em" }], // 40px
        h3: ["2.125rem", { lineHeight: "1.22", letterSpacing: "-0.03em" }], // 34px
        h4: ["1.75rem", { lineHeight: "1.28", letterSpacing: "-0.02em" }], // 28px
        h5: ["1.5rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }], // 24px
        h6: ["1rem", { lineHeight: "1.40", letterSpacing: "-0.005em" }], // 24px

        large: ["1.5rem", { lineHeight: "1.6" }],
        medium: ["1.25rem", { lineHeight: "1.65" }],
        small: ["1.125rem", { lineHeight: "1.65" }],
      },

      // --------------------
      // RADIUS
      // (rounded-card, rounded-form, rounded-image, etc.)
      // --------------------
      borderRadius: {
        card: "0.5rem", // 8px
        form: "0.5rem",
        image: "0.75rem",
        button: "9999px", // pill
      },

      // --------------------
      // SPACING / HEIGHTS
      // --------------------
      spacing: {
        18: "4.5rem", // 72px => pour h-18, min-h-18
      },

      // Optionnel : ombres issues de effect.medium, etc. :contentReference[oaicite:2]{index=2}
      boxShadow: {
        xxs: "0 1px 2px 0 #0000000d",
        xs: "0 1px 2px 0 #0000000f, 0 1px 3px 0 #0000001a",
        sm: "0 2px 4px -2px #0000000f, 0 4px 8px -2px #0000001a",
        md: "0 4px 6px -2px #00000008, 0 12px 16px -4px #00000014",
      },
    },
  },
  plugins: [],
};
