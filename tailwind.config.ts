import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Tailwind CSS 3 includes the rtl: variant as a core variant.
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
