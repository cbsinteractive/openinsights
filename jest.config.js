module.exports = {
    preset: "ts-jest",
    testRegex: "\\.test\\.ts",
    collectCoverageFrom: ["src/init.ts", "src/lib/*.ts"],
    automock: false,
    testEnvironment: "jsdom",
}
