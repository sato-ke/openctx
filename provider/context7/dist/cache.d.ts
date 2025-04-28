export declare class Cache<T> {
    private cache;
    private timeoutMS;
    constructor(opts: {
        ttlMS: number;
    });
    getOrFill(key: string, fill: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=cache.d.ts.map