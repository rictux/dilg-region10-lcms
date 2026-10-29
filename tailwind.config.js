/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Public Sans Variable"',
          '"Public Sans"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      colors: {
        // Cool slate ink with a faint green cast, so neutrals sit with the civic green.
        ink: {
          DEFAULT: '#1b2430',
          soft: '#3b4552',
          muted: '#5b6573',
          subtle: '#8a94a3',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f4f5f2',
          sunken: '#eceee9',
        },
        line: {
          DEFAULT: '#e1e5de',
          strong: '#cbd1c8',
          soft: '#eef0ec',
        },
        // Seal gold: used only to mark the current place (active nav, period tag).
        seal: {
          50: '#fbf6e9',
          200: '#ecd9a6',
          500: '#b8892b',
          700: '#7d5a12',
        },
        civic: {
          50: '#f1f7f4',
          100: '#dceae3',
          200: '#bcd6c9',
          300: '#8fbaa6',
          400: '#5e9b82',
          500: '#2f7d64',
          600: '#276b56',
          700: '#225747',
          800: '#1c463a',
          900: '#17392f',
        },
        audit: {
          50: '#fff7ed',
          500: '#d97706',
          700: '#9a3412',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(27, 36, 48, 0.04)',
        soft: '0 1px 2px rgba(27, 36, 48, 0.04), 0 0 0 1px rgba(27, 36, 48, 0.04)',
        lift: '0 4px 12px -4px rgba(27, 36, 48, 0.1)',
        pop: '0 12px 32px -12px rgba(27, 36, 48, 0.22)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem',
      },
      letterSpacing: {
        tightish: '-0.012em',
        tighter2: '-0.018em',
      },
    },
  },
  plugins: [],
}
