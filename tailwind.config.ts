import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Tailwind CSS 3 includes the rtl: variant as a core variant.
  theme: {
    extend: {
      colors: {
        ink: '#20243a',
        canvas: {
          DEFAULT: '#f3f6fb',
          dark: '#e8edf5',
        },
        teal: {
          DEFAULT: '#287d78',
          dark: '#1f6662',
        },
        amber: {
          DEFAULT: '#f2b84b',
          dark: '#ad7000',
        },
        coral: '#dd6c60',
        violet: '#7771c7',
        mint: '#9fe1d4',
        hero: '#293153',
      },
      fontFamily: {
        sans: ['Assistant Variable', 'Arial', 'sans-serif'],
        display: ['Rubik Variable', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(32, 36, 58, 0.07)',
        'card-hover': '0 18px 42px rgba(32, 36, 58, 0.13)',
        button: '0 8px 18px rgba(40, 125, 120, 0.22)',
        dialog: '0 28px 80px rgba(20, 25, 46, 0.28)',
        menu: '0 16px 38px rgba(32, 36, 58, 0.18)',
        hero: '0 18px 40px rgba(41, 49, 83, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config;
