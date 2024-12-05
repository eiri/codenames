/** @type {import('tailwindcss').Config} */

import defaultTheme from "tailwindcss/defaultTheme.js";

export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    fontFamily: {
      serif: ['"Playfair"', ...defaultTheme.fontFamily.serif],
      sans: ['"Source Sans 3"', ...defaultTheme.fontFamily.sans],
    },
    extend: {
      backgroundImage: {
        login: "url('./bg.jpg')",
      },
      colors: {
        "code-blue": {
          700: "#467e98" /* 228 60 50 */,
          300: "#d0e6f4" /* 228 60 90 */,
        },
        "code-red": {
          700: "#c84c64" /* 4 60 50 */,
          300: "#f4dde0" /* 4 60 90 */,
        },
        ivory: "#fbf2e9" /* 56 60 96 */,
      },
    },
  },
  plugins: [],
};
