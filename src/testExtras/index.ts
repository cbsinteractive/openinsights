/**
 * Simulate an event loop running to allow awaited processes to complete
 */
export function runEventLoop() {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), 0))
}
