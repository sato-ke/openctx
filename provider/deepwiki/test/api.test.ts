/**
 * Unit tests for API functions
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { clearCache, createErrorItem, debounce, fetchDeepwikiHTML, getCacheStats } from '../api.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('fetchDeepwikiHTML', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clearCache()
    })

    test('fetches HTML successfully', async () => {
        const mockHtml = '<html><body>Test content</body></html>'
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        })

        const result = await fetchDeepwikiHTML('facebook/react')

        expect(mockFetch).toHaveBeenCalledWith(
            'https://deepwiki.com/facebook/react',
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            }),
        )
        expect(result).toBe(mockHtml)
    })

    test('uses cached result on second call', async () => {
        const mockHtml = '<html><body>Cached content</body></html>'
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        })

        // First call
        const result1 = await fetchDeepwikiHTML('facebook/react')
        expect(result1).toBe(mockHtml)
        expect(mockFetch).toHaveBeenCalledTimes(1)

        // Second call should use cache
        const result2 = await fetchDeepwikiHTML('facebook/react')
        expect(result2).toBe(mockHtml)
        expect(mockFetch).toHaveBeenCalledTimes(1) // No additional fetch
    })

    test('handles timeout error', async () => {
        const timeoutError = new Error('Timeout')
        timeoutError.name = 'TimeoutError'
        mockFetch.mockRejectedValueOnce(timeoutError)

        await expect(fetchDeepwikiHTML('facebook/react')).rejects.toThrow(
            'Connection to deepwiki.com timed out',
        )
    })

    test('handles abort error', async () => {
        const abortError = new Error('Aborted')
        abortError.name = 'AbortError'
        mockFetch.mockRejectedValueOnce(abortError)

        await expect(fetchDeepwikiHTML('facebook/react')).rejects.toThrow(
            'Request to deepwiki.com was aborted',
        )
    })

    test('handles network error', async () => {
        const networkError = new Error('Network error')
        mockFetch.mockRejectedValueOnce(networkError)

        await expect(fetchDeepwikiHTML('facebook/react')).rejects.toThrow(
            'Failed to fetch from deepwiki.com: Network error',
        )
    })

    test('handles unknown error', async () => {
        mockFetch.mockRejectedValueOnce('Unknown error')

        await expect(fetchDeepwikiHTML('facebook/react')).rejects.toThrow(
            'Unknown error occurred while fetching HTML',
        )
    })

    test('caches even failed responses that return HTML', async () => {
        const mockHtml = '<html><body>No markdown content</body></html>'
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockHtml),
        })

        const result = await fetchDeepwikiHTML('nonexistent/repo')
        expect(result).toBe(mockHtml)

        // Verify it's cached
        const result2 = await fetchDeepwikiHTML('nonexistent/repo')
        expect(result2).toBe(mockHtml)
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })
})

describe('createErrorItem', () => {
    test('creates error item with correct structure', () => {
        const result = createErrorItem('Test Error', 'This is a test error message')

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
            title: 'Error: Test Error',
            uri: '',
            description: 'This is a test error message',
            data: {
                content: 'Error occurred: This is a test error message',
                isError: true,
            },
        })
    })

    test('handles empty strings', () => {
        const result = createErrorItem('', '')

        expect(result[0].title).toBe('Error: ')
        expect(result[0].description).toBe('')
        expect(result[0].data?.content).toBe('Error occurred: ')
    })
})

describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    test('debounces function calls', async () => {
        const mockFn = vi.fn().mockResolvedValue('result')
        const debouncedFn = debounce(mockFn, 100, 'cancelled')

        // Call multiple times quickly
        const promise1 = debouncedFn('arg1')
        const promise2 = debouncedFn('arg2')
        const promise3 = debouncedFn('arg3')

        // Fast-forward time
        vi.advanceTimersByTime(100)

        // Wait for promises to resolve
        const results = await Promise.all([promise1, promise2, promise3])

        // Only the last call should execute
        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(mockFn).toHaveBeenCalledWith('arg3')

        // First two calls should return cancelled value
        expect(results[0]).toBe('cancelled')
        expect(results[1]).toBe('cancelled')
        expect(results[2]).toBe('result')
    })

    test('handles function that throws error', async () => {
        const mockFn = vi.fn().mockRejectedValue(new Error('Test error'))
        const debouncedFn = debounce(mockFn, 100, 'cancelled')

        const promise = debouncedFn('arg')
        vi.advanceTimersByTime(100)

        await expect(promise).rejects.toThrow('Test error')
    })

    test('cancels previous calls when new call is made', async () => {
        const mockFn = vi.fn().mockResolvedValue('result')
        const debouncedFn = debounce(mockFn, 100, 'cancelled')

        const promise1 = debouncedFn('arg1')

        // Advance time partially
        vi.advanceTimersByTime(50)

        // Make another call before first completes
        const promise2 = debouncedFn('arg2')

        // Complete the debounce period
        vi.advanceTimersByTime(100)

        const results = await Promise.all([promise1, promise2])

        expect(mockFn).toHaveBeenCalledTimes(1)
        expect(mockFn).toHaveBeenCalledWith('arg2')
        expect(results[0]).toBe('cancelled')
        expect(results[1]).toBe('result')
    })
})

describe('cache management', () => {
    beforeEach(() => {
        clearCache()
    })

    test('clearCache empties the cache', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('<html>test</html>'),
        })

        // Add something to cache
        await fetchDeepwikiHTML('test/repo')
        expect(getCacheStats().size).toBe(1)

        // Clear cache
        clearCache()
        expect(getCacheStats().size).toBe(0)
    })

    test('getCacheStats returns correct information', () => {
        const stats = getCacheStats()
        expect(stats).toEqual({
            size: 0,
            maxSize: 100,
        })
    })
})
