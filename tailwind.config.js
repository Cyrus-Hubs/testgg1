/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Chakra Petch"', '"Noto Sans Thai"', 'sans-serif'],
        sans: ['"Noto Sans Thai"', '"Chakra Petch"', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        desk: '#1b3344',
        felt: '#142833',
        acid: '#39f3b0',
        hot: '#ff3d6e',
        yolk: '#ffc857',
        paper: '#e7e1d2',
        ink: '#17202a',
        steel: '#93a4b5',
      },
      boxShadow: {
        win: '4px 4px 0 #05080c',
        insetwin: 'inset 2px 2px 0 rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [],
}
