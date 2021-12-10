import * as sut from "./index"

describe("index.ts", () => {
    test("exports", () => {
        expect(sut).toHaveProperty("init")
        expect(sut).toHaveProperty("ClientSettingsBuilder")
        expect(sut).toHaveProperty("ProviderBase")
        expect(sut).toHaveProperty("Test")
        expect(sut).toHaveProperty("Fetch")
    })
})
