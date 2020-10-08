export abstract class GetBeaconHandler<R> {
    send(url: string): Promise<R> {
        return fetch(url, { method: "GET", keepalive: true }).then((r) =>
            this.makeSendResult(r),
        )
    }

    abstract makeSendResult(r?: Response): R
}
