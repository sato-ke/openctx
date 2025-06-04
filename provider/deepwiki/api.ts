import QuickLRU from 'quick-lru'
import { buildDeepwikiURL } from './core.js'
import type { MentionsResult, ChatHistoryData } from './types.js'
import { TIMEOUTS } from './types.js'

// Cache for HTML responses
const htmlCache = new QuickLRU<string, string>({
    maxSize: 100,
    maxAge: 1000 * 60 * 10, // 10 minutes
})

/**
 * Debounce function
 * @param fn - Function to debounce
 * @param timeout - Debounce delay in milliseconds
 * @param cancelledReturn - Value to return when cancelled
 * @returns Debounced function
 */
export function debounce<F extends (...args: any[]) => any>(
    fn: F,
    timeout: number,
    cancelledReturn: Awaited<ReturnType<F>>,
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
    let controller = new AbortController()
    let timeoutId: NodeJS.Timeout

    return (...args) => {
        return new Promise((resolve, reject) => {
            controller.abort()

            controller = new AbortController()
            const { signal } = controller

            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn(...args)
                    resolve(result)
                } catch (error) {
                    reject(error)
                }
            }, timeout)

            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId)
                resolve(cancelledReturn)
            })
        })
    }
}

/**
 * Fetch HTML from deepwiki.com with caching and error handling
 * @param repoName - Repository name in "user/repo" format
 * @returns HTML content
 * @throws Error - If fetch fails or times out
 */
export async function fetchDeepwikiHTML(repoName: string): Promise<string> {
    const url = buildDeepwikiURL(repoName)

    // Check cache first
    if (htmlCache.has(url)) {
        return htmlCache.get(url)!
    }

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(TIMEOUTS.FETCH_HTML),
        })

        // Note: deepwiki.com always returns 200 OK even for non-existent repos
        // Error detection is done by checking markdown content existence
        const html = await response.text()

        // Cache the result (even if it contains no markdown content)
        htmlCache.set(url, html)

        return html
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'TimeoutError') {
                throw new Error('Connection to deepwiki.com timed out')
            }
            if (error.name === 'AbortError') {
                throw new Error('Request to deepwiki.com was aborted')
            }
            throw new Error(`Failed to fetch from deepwiki.com: ${error.message}`)
        }
        throw new Error('Unknown error occurred while fetching HTML')
    }
}

/**
 * Create error mention item
 * @param title - Error title
 * @param description - Error description
 * @returns Error mention result
 */
export function createErrorItem(title: string, description: string): MentionsResult {
    return [
        {
            title: `Error: ${title}`,
            uri: '',
            description,
            data: {
                content: `Error occurred: ${description}`,
                isError: true,
            },
        },
    ]
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

/**
 * Fetch chat history from DeepWiki API
 * @param sessionId - Session ID from chat URL
 * @returns Chat history data
 * @throws Error - If fetch fails or times out
 */
export async function fetchChatHistory(sessionId: string): Promise<ChatHistoryData> {
    const url = `https://api.devin.ai/ada/query/${sessionId}`

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(TIMEOUTS.FETCH_HTML),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Chat session not found')
            }
            throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid chat history data format')
        }

        if (!('title' in data) || !('queries' in data) || !Array.isArray(data.queries)) {
            throw new Error('Missing required fields in chat history')
        }

        return data as ChatHistoryData
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'TimeoutError') {
                throw new Error('Connection to DeepWiki API timed out')
            }
            if (error.name === 'AbortError') {
                throw new Error('Request to DeepWiki API was aborted')
            }
            throw error
        }
        throw new Error('Unknown error occurred while fetching chat history')
    }
}
