/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B263B', // Navy Blue
        primaryLight: '#415A77', // Lighter Navy for hovers
        secondary: '#778DA9', // Muted Blue/Grey
        ivory: '#FDFBF7', // Main Background (Ivory)
        vanilla: '#F2E8CF', // Darker Vanilla/Beige
        surface: '#FFFFFF', // Pure White for cards
        black: '#0D0D0D', // Deep Black
        dark: '#000000', // Pure Black
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
