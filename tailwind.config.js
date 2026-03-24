/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          primary: '#2bafa0',
        },
        navy: {
          header: '#2c3444',
        },
      },
      fontFamily: {
        hebrew: ['Rubik', 'Assistant', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
