module.exports = {
    printWidth: 80,
    semi: false,
    trailingComma: "all",
    tabWidth: 4,
    overrides: [
        {
            files: ["*.json"],
            options: {
                tabWidth: 2,
            },
        },
    ],
}
