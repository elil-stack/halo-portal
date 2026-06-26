/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a1124',
          900: '#0d1730',
          800: '#13213f',
          700: '#1b2d52',
          600: '#26406e',
          500: '#34528a',
        },
        accent: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
        // Status palette
        status: {
          assembly: '#6b7280',
          testing: '#eab308',
          shipment: '#3b82f6',
          placement: '#f97316',
          validation: '#a855f7',
          operational: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
