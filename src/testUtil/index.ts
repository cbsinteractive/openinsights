export type TestCaseConfig = {
    description: string
}

export const makeDescription = (...items: string[]): string => {
    if (!items.length) {
        throw new Error(
            "makeDescription should be passed one or more strings to combine",
        )
    }
    return items.join("; ")
}
