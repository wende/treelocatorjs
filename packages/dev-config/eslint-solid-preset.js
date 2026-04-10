module.exports = {
  extends: ["./eslint-base-preset.js", "plugin:solid/typescript"],
  plugins: ["solid"],
  rules: {
    // In Solid, it is common to use on many places :/
    "@typescript-eslint/no-non-null-assertion": "off",
  },
};
