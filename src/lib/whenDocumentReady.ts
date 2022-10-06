/**
 * Utility to resolve a Promise when the browsers ready state reaches "complete"
 */
export function loadWhenReady(
    getDocumentReadyState: () => DocumentReadyState,
    addDocumentReadyStateChangeListener: (callback: () => void) => void,
): Promise<void> {
    // If document is ready, resolve immediately
    if (getDocumentReadyState() === "complete") {
        return Promise.resolve()
    }
    // Otherwise, attach event listener to resolve when ready
    return new Promise((resolve) => {
        addDocumentReadyStateChangeListener(() => {
            if (getDocumentReadyState() === "complete") {
                resolve()
            }
        })
    })
}
