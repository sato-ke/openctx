export class Cache {
    cache = new Map();
    timeoutMS;
    constructor(opts) {
        this.timeoutMS = opts.ttlMS;
    }
    async getOrFill(key, fill) {
        const entry = this.cache.get(key);
        if (entry) {
            return entry.value;
        }
        const value = await fill();
        this.cache.set(key, { value });
        const timeout = setTimeout(() => this.cache.delete(key), this.timeoutMS);
        if (typeof timeout !== "number" && "unref" in timeout)
            timeout.unref();
        return value;
    }
}
//# sourceMappingURL=cache.js.map