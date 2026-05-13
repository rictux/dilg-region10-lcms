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
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#18181b',
          soft: '#3f3f46',
          muted: '#71717a',
          subtle: '#a1a1aa',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#fafafa',
          sunken: '#f4f4f5',
        },
        line: {
          DEFAULT: '#e4e4e7',
          strong: '#d4d4d8',
          soft: '#f1f1f3',
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
        panel: '0 1px 2px rgba(24, 24, 27, 0.04)',
        soft: '0 1px 2px rgba(24, 24, 27, 0.04), 0 0 0 1px rgba(24, 24, 27, 0.04)',
        lift: '0 4px 12px -4px rgba(24, 24, 27, 0.08)',
        pop: '0 10px 30px -12px rgba(24, 24, 27, 0.18)',
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
