module.exports = {
    preset: "ts-jest",
    testRegex: "\\.test\\.ts",
    collectCoverageFrom: ["src/init.ts", "src/lib/*.ts", "src/util/*.ts"],
    automock: false,
    testEnvironment: "jsdom",
}
