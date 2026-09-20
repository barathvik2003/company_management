import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F6F4',
        surface: '#FFFFFF',
        ink: '#16191C',
        muted: '#5C6570',
        line: '#DCE0DC',
        accent: { DEFAULT: '#17513F', soft: '#E4EDE8', strong: '#0E3A2C' },
        ok: { DEFAULT: '#1F7A4D', soft: '#E3F2E9' },
        warn: { DEFAULT: '#8A5A06', soft: '#FBEFD8' },
        risk: { DEFAULT: '#B3261E', soft: '#FBE4E2' },
        info: { DEFAULT: '#1F5FA8', soft: '#E3ECF8' },
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        metric: ['1.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      borderRadius: { card: '6px' },
    },
  },
  plugins: [],
};

export default config;
