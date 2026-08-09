const { createGlobPatternsForDependencies } = require("@nx/angular/tailwind");
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, "src/**/!(*.stories|*.spec).{ts,html}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    fontFamily: {
      body: ["Roboto", '"Helvetica Neue"', "sans-serif"],
      mono: ['"Roboto Mono"', "monospace"],
      code: ["Consolas", "Courier New", "monospace"],
      "7seg": ['"FS Sevegment"', '"Roboto Mono"', "monospace"],
    },
    extend: {
      colors: {
        alnasl: {
          50: "#fff8e1",
          100: "#ffecb3",
          200: "#ffe082",
          300: "#ffd54f",
          400: "#ffca28",
          500: "#ffc107",
          600: "#ffb300",
          700: "#ffa000",
          800: "#ff8f00",
          900: "#ff6f00",
        },
        gray: {
          50: "#e6e6e6",
          100: "#c1c1c1",
          200: "#989898",
          300: "#6e6e6e",
          400: "#4f4f4f",
          450: "#424242",
          500: "#303030",
          600: "#2b2b2b",
          700: "#242424",
          800: "#1e1e1e",
          900: "#131313",
        },
      },
    },
  },
  plugins: [],
};
