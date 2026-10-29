
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        academy: {
          paper: '#F7F7F2',
          ink: '#202B22',
          green: '#315C43',
          lime: '#D6F078',
          muted: '#70776D',
          line: '#E2E4DA',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        editorial: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
