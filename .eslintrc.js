module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
    plugins: ["prettier"],
    extends: ["plugin:prettier/recommended"],
    rules: {
        "prettier/prettier": "error",
    },
}
