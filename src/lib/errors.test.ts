import { KnownErrors } from "./errors"

describe("KnownErrors", () => {
    test("expected values", () => {
        // In case anyone depends on this enumeration downstream, ensure its
        // members keep their expected values.
        expect(KnownErrors.SendBeacon).toBe(0)
        expect(KnownErrors.ProviderConfigFetch).toBe(1)
        expect(KnownErrors.TestResourceFetch).toBe(2)
        expect(KnownErrors.TestExecution).toBe(3)
    })
})
