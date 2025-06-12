/**
 * Debounce function that returns a promise
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay: number
): T {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return ((...args: Parameters<T>) => {
        return new Promise((resolve, reject) => {
            // Cancel previous pending call
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
            }

            timeoutId = setTimeout(async () => {
                timeoutId = null

                try {
                    const result = await fn(...args)
                    resolve(result)
                } catch (error) {
                    reject(error)
                }
            }, delay)
        })
    }) as T
}