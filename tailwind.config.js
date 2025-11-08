module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5faff',
          100: '#e8f5fb',
          200: '#d3eefd',
          300: '#b1e1fa',
          400: '#89d3f5',
          500: '#5dc6f0',
          600: '#3aaee0',
          700: '#289dcf',
          800: '#1e84b0',
          900: '#186e93',
        },
        secondary: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        tertiary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      backdropFilter: {
        none: 'none',
        blur: 'blur(20px)',
      },
      backgroundColor: {
        glass: 'rgba(255, 255, 255, 0.25)',
        'glass-dark': 'rgba(0, 0, 0, 0.25)',
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.18)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [],
};
