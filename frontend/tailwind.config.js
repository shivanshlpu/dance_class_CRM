/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffdf5',
          100: '#fcf8e3',
          200: '#fde8b1',
          300: '#facf70',
          400: '#f5b33d',
          500: '#d49520',
          600: '#a36d10',
          700: '#825209',
          800: '#6b410f',
          900: '#5c3810',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
