import { loadWhenReady } from "./whenDocumentReady"

test("initially complete", async () => {
    await loadWhenReady(
        () => "complete",
        () => {},
    )
})

test("initially loading", async () => {
    const mockGetReadyState = jest.fn()
    mockGetReadyState.mockReturnValueOnce("loading")
    mockGetReadyState.mockReturnValueOnce("complete")
    const mockAddReadyStateChangeListener = jest.fn()
    // Don't await this right await because we want to access the event-handling code
    const loadReadyResult = loadWhenReady(
        mockGetReadyState,
        mockAddReadyStateChangeListener,
    )
    const eventHandler = mockAddReadyStateChangeListener.mock.calls[0][0]
    eventHandler()
    await loadReadyResult
    expect(mockGetReadyState).toHaveBeenCalledTimes(2)
    expect(mockAddReadyStateChangeListener).toHaveBeenCalledTimes(1)
})
