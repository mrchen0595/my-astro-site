/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-astro"],

  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],

  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
};

export default config;
