describe("index.ts", () => {
    interface TestConfig {
        description: string
    }
    const tests: Array<TestConfig> = [
        {
            description: "Replace me!",
        },
    ]
    tests.forEach((i) => {
        test(i.description, () => {
            expect.assertions(0)
        })
    })
})
