module.exports = {
    preset: "ts-jest",
    testRegex: "\\.test\\.ts",
    collectCoverageFrom: ["src/*.ts", "src/lib/*.ts", "src/util/*.ts"],
    automock: false,
    setupFiles: ["./setupJest.js"],
}
