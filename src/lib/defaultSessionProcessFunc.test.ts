import { defaultSessionProcessFunc } from "./defaultSessionProcessFunc"

test("successes and failures", async () => {
    const result = await defaultSessionProcessFunc([
        {
            execute: () => Promise.resolve("result 1"),
        },
        {
            execute: () => Promise.reject("error 1"),
        },
        {
            execute: () => Promise.resolve("result 2"),
        },
        {
            execute: () => Promise.reject("error 2"),
        },
    ])
    expect(result).toStrictEqual({
        testResults: ["result 1", "result 2"],
    })
})
