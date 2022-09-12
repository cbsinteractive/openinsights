import { loadWhenReady } from "./whenDocumentReady"

test("initially complete", async () => {
    await loadWhenReady({ readyState: "complete" } as Document)
})

test("initially loading", async () => {
    const fakeDocument = {
        addEventListener: jest.fn(),
        readyState: "loading",
    }
    const result = loadWhenReady(fakeDocument as unknown as Document)
    const forceUpdatable = fakeDocument as { readyState: string }
    forceUpdatable.readyState = "complete"
    const callback = fakeDocument.addEventListener.mock.calls[0][1]
    callback()
    await result
})

// describe("loadWhenDocumentReady", () => {
//     test("readyState complete initially", () => {
//         return loadWhenReady().then(() => {
//             // do nothing
//         })
//     })
//     test("readyState loading initially", (done) => {
//         let calls = 0
//         Object.defineProperty(document, "readyState", {
//             get() {
//                 let result: "complete" | "loading" = "loading"
//                 if (++calls > 2) {
//                     result = "complete"
//                 }
//                 return result
//             },
//         })
//         loadWhenReady().then(() => {
//             done()
//         })
//         document.dispatchEvent(new Event("readystatechange"))
//         document.dispatchEvent(new Event("readystatechange"))
//     })
// })
