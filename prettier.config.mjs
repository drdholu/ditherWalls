/** @type {import("prettier").Config} */
const config = {
  singleQuote: false,
  semi: true,
  tabWidth: 2,
  printWidth: 100,
  trailingComma: "all",
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
