const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = defineConfig([
  globalIgnores(["dist/*", "venv/**", ".expo/**"]),
  expoConfig,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "react/jsx-uses-vars": "error",
      "unused-imports/no-unused-imports": "error",
      // switched off: false alarms for React Native's Animated pattern and our deliberate effects
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]);