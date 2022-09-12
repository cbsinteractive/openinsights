import { defaultSessionProcessFunc } from "./defaultSessionProcessFunc"

test("foo", async () => {
    const result = await defaultSessionProcessFunc([
        {
            execute: () => Promise.resolve("some executable result"),
        },
    ])
    expect(result).toStrictEqual({
        testResults: ["some executable result"],
    })
})
