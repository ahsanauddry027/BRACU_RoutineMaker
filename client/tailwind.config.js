/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1a3a5c',
        'navy-light': '#234b73',
        'grid-bg': '#eef2f7',
        'grid-hover': '#dce4ed',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      minWidth: {
        'grid': '1200px',
      },
    },
  },
  plugins: [],
};
