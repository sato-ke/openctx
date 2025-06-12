import QuickLRU from 'quick-lru'
import type { FetchResult, Settings } from './types.js'

// Cache for HTML responses
const htmlCache = new QuickLRU<string, string>({
    maxSize: 100,
    maxAge: 1000 * 60 * 10, // 10 minutes
})

/**
 * Fetch web page with timeout and error handling
 */
export async function fetchWebPage(url: string, settings: Settings): Promise<FetchResult> {
    // Check cache first
    if (htmlCache.has(url)) {
        return {
            html: htmlCache.get(url)!,
            url,
            statusCode: 200, // Cached responses are assumed successful
        }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), settings.requestTimeout)
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': settings.userAgent,
            },
        })
        
        clearTimeout(timeoutId)
        
        // Check for HTTP errors
        if (response.status === 404) {
            throw new Error('Page not found (404)')
        }
        
        if (response.status >= 400) {
            throw new Error(`HTTP error: ${response.status}`)
        }
        
        const html = await response.text()
        
        // Cache the result (only successful responses)
        htmlCache.set(url, html)
        
        return {
            html,
            url,
            statusCode: response.status,
        }
    } catch (error) {
        clearTimeout(timeoutId)
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${settings.requestTimeout}ms`)
            }
            throw new Error(`Network error: ${error.message}`)
        }
        
        throw new Error('Unknown error occurred')
    }
}

/**
 * Clear HTML cache (useful for testing)
 */
export function clearCache(): void {
    htmlCache.clear()
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats(): { size: number; maxSize: number } {
    return {
        size: htmlCache.size,
        maxSize: htmlCache.maxSize,
    }
}