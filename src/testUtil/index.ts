export { TestPerformanceResourceTiming } from "./testPerformanceResourceTiming"

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

export function deepClone<T>(value: object): T {
    const copyCurrentLevelProps: (source: Record<string, any>) => any = (
        source: Record<string, any>,
    ) => {
        if (Array.isArray(source)) {
            return source.map((value) => {
                if (typeof value === "string" || value == null) {
                    return value
                } else if (typeof value === "object") {
                    return copyCurrentLevelProps(value)
                } else {
                    throw new Error(
                        `Unsupported type: ${typeof value} (${value})`,
                    )
                }
            })
        }
        const result: Record<string, any> = {}
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                const valueToCopy = source[key]
                if (valueToCopy === null) {
                    result[key] = null
                } else if (
                    typeof valueToCopy === "string" ||
                    typeof valueToCopy === "number"
                ) {
                    result[key] = source[key]
                } else if (typeof valueToCopy === "object") {
                    result[key] =
                        valueToCopy instanceof Date
                            ? valueToCopy
                            : copyCurrentLevelProps(valueToCopy)
                } else {
                    throw new Error(
                        `Unsupported type: ${typeof valueToCopy} (${key}:${valueToCopy})`,
                    )
                }
            }
        }
        return result
    }
    const result = copyCurrentLevelProps(value)
    expect(result).toStrictEqual(value)
    return result as unknown as T
}
