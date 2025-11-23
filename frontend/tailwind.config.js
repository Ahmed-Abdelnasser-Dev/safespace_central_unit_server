/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'safe-blue': '#3b82f6',
        'safe-dark': '#0f172a',
      },
    },
  },
  plugins: [],
}
