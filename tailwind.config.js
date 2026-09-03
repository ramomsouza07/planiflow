/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        dark: {
          bg: '#090b10',
          surface: '#11141d',
          surfaceHover: '#161a26',
          border: '#1b202e',
          subtle: '#23293b',
        },
        brand: {
          blue: '#0066ff',
          blueHover: '#1a75ff',
          blueGlow: 'rgba(0, 102, 255, 0.25)',
          green: '#00d284',
          greenGlow: 'rgba(0, 210, 132, 0.2)',
          red: '#ff4d6a',
          redGlow: 'rgba(255, 77, 106, 0.2)',
        },
      },
    },
  },
  plugins: [],
}
