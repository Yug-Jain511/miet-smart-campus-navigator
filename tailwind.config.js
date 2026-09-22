/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy navigation blue — reserved for route line + GPS states only.
        primary: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#1668dc',
          600: '#1258bd',
          700: '#0f4a9e',
        },
        // MIET brand red sampled from src/assets/miet-logo.png (#E22126).
        brand: {
          DEFAULT: '#E22126',
          dark: '#B3121A',
          ink: '#9E0F16',
          tint: '#FDECEC',
        },
        // Institutional charcoal sampled from the logo (#35363B).
        ink: {
          DEFAULT: '#35363B',
          deep: '#16181D',
          soft: '#5B5E66',
        },
        paper: '#F6F5F1',
      },
      borderRadius: {
        card: '1rem',
        panel: '10px',
        control: '8px',
      },
      fontFamily: {
        // Tuned system stack — no webfont downloads, works fully offline.
        sans: [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        kicker: '0.14em',
      },
    },
  },
  plugins: [],
}
