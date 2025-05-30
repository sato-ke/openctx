/**
 * Integration tests for the main provider
 */

import type { ItemsParams, Provider } from '@openctx/provider'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { clearCache } from '../api.js'
import provider, { validateSettings } from '../index.js'
import type { Settings } from '../types.js'

const deepwikiProvider = provider as Omit<Required<Provider>, 'annotations' | 'dispose'>

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('validateSettings', () => {
    test('applies default values for missing settings', () => {
        const result = validateSettings({})
        expect(result).toEqual({
            maxMentionItems: 5,
            maxTokens: 3000,
            debounceDelay: 300,
            enableNavigation: true,
        })
    })

    test('enforces minimum limits', () => {
        const result = validateSettings({
            maxMentionItems: -1,
            maxTokens: 50,
            debounceDelay: 50,
        })
        expect(result.maxMentionItems).toBe(1)
        expect(result.maxTokens).toBe(1000)
        expect(result.debounceDelay).toBe(100)
    })

    test('enforces maximum limits', () => {
        const result = validateSettings({
            maxMentionItems: 100,
            maxTokens: 20000,
            debounceDelay: 5000,
        })
        expect(result.maxMentionItems).toBe(20)
        expect(result.maxTokens).toBe(20000)
        expect(result.debounceDelay).toBe(1000)
    })

    test('handles enableNavigation false', () => {
        const result = validateSettings({ enableNavigation: false })
        expect(result.enableNavigation).toBe(false)
    })

    test('preserves valid values within limits', () => {
        const settings: Settings = {
            maxMentionItems: 10,
            maxTokens: 5000,
            debounceDelay: 500,
            enableNavigation: false,
        }
        const result = validateSettings(settings)
        expect(result).toEqual(settings)
    })
})

describe('deepwikiProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        clearCache()
    })

    describe('meta', () => {
        test('returns correct metadata', () => {
            const result = deepwikiProvider.meta({}, {})

            expect(result).toEqual({
                name: 'deepwiki',
                mentions: {
                    label: 'type <user/repo or githubUrl> [page search query or page number]',
                },
            })
        })
    })

    describe('mentions', () => {
        test('returns empty array for empty query', async () => {
            const result = await deepwikiProvider.mentions({ query: '' }, {})
            expect(result).toEqual([])
        })

        test('returns empty array for whitespace-only query', async () => {
            const result = await deepwikiProvider.mentions({ query: '   ' }, {})
            expect(result).toEqual([])
        })

        test('returns error item for invalid repository format', async () => {
            const result = await deepwikiProvider.mentions({ query: 'invalid-repo' }, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toContain('Error')
            expect(result[0].data?.isError).toBe(true)
        })

        test('returns navigation item when no search query provided', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# Overview\\n\\nThis is the overview page with sufficient content to be detected as markdown content by our parser."]);
                        self.__next_f.push([1,"# API Reference\\n\\n## REST API\\n\\nThis is the API documentation page with detailed information about the REST API endpoints."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const result = await deepwikiProvider.mentions({ query: 'facebook/react' }, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('facebook/react Wiki Navigation')
            expect(result[0]?.data?.isNavigation).toBe(true)
            expect(result[0]?.data?.content).toContain('Available Wiki Pages')
        })

        test('returns individual pages when search query provided', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# API Reference\\n\\n## REST API\\n\\nThis is the API documentation page with detailed information about the REST API endpoints."]);
                        self.__next_f.push([1,"# Getting Started\\n\\n## Installation\\n\\nThis is the getting started guide with installation instructions and setup information."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const result = await deepwikiProvider.mentions({ query: 'facebook/react API' }, {})

            expect(result.length).toBeGreaterThan(0)
            expect(result[0].title).toContain('API Reference')
            expect(result[0]?.data?.isNavigation).toBe(false)
            expect(result[0]?.data?.content).toContain('# API Reference')
        })

        test('returns error item when no markdown pages found', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"no markdown content here"]);
                        self.__next_f.push([1,"19:T3324,"]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const result = await deepwikiProvider.mentions({ query: 'nonexistent/repo' }, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toContain('Error: Repository not found')
            expect(result[0]?.data?.isError).toBe(true)
        })

        test('handles network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'))

            const result = await deepwikiProvider.mentions({ query: 'facebook/react' }, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toContain('Error')
            expect(result[0]?.data?.isError).toBe(true)
        })

        test('respects maxMentionItems setting', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# Page 1\\n\\nContent for page 1 with sufficient length to be detected as markdown content."]);
                        self.__next_f.push([1,"# Page 2\\n\\nContent for page 2 with sufficient length to be detected as markdown content."]);
                        self.__next_f.push([1,"# Page 3\\n\\nContent for page 3 with sufficient length to be detected as markdown content."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const settings: Partial<Settings> = { maxMentionItems: 2 }
            const result = await deepwikiProvider.mentions({ query: 'test/repo search' }, settings)

            expect(result.length).toBeLessThanOrEqual(2)
        })

        test('returns specific pages when page numbers provided', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# Overview\\n\\nThis is the overview page with sufficient content to be detected as markdown content by our parser."]);
                        self.__next_f.push([1,"# API Reference\\n\\n## REST API\\n\\nThis is the API documentation page with detailed information about the REST API endpoints."]);
                        self.__next_f.push([1,"# Getting Started\\n\\n## Installation\\n\\nThis is the getting started guide with installation instructions and setup information."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const result = await deepwikiProvider.mentions({ query: 'facebook/react 1/3' }, {})

            expect(result).toHaveLength(2)
            expect(result[0].title).toContain('Overview')
            expect(result[1].title).toContain('Getting Started')
            expect(result[0]?.data?.isNavigation).toBe(false)
            expect(result[1]?.data?.isNavigation).toBe(false)
        })

        test('handles single page number', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# Overview\\n\\nThis is the overview page with sufficient content to be detected as markdown content by our parser."]);
                        self.__next_f.push([1,"# API Reference\\n\\n## REST API\\n\\nThis is the API documentation page with detailed information about the REST API endpoints."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const result = await deepwikiProvider.mentions({ query: 'facebook/react 2' }, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toContain('API Reference')
            expect(result[0]?.data?.isNavigation).toBe(false)
        })

        test('handles out of range page numbers gracefully', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# Overview\\n\\nThis is the overview page with sufficient content to be detected as markdown content by our parser."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const result = await deepwikiProvider.mentions({ query: 'facebook/react 1/999' }, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toContain('Overview')
        })

        test('returns empty array when all page numbers are out of range', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# Overview\\n\\nThis is the overview page with sufficient content to be detected as markdown content by our parser."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const result = await deepwikiProvider.mentions({ query: 'facebook/react 999/1000' }, {})

            expect(result).toEqual([])
        })

        test('disables navigation when enableNavigation is false', async () => {
            const mockHtml = `
                <html>
                    <script>
                        self.__next_f.push([1,"# Overview\\n\\nThis is the overview page with sufficient content to be detected as markdown content by our parser."]);
                    </script>
                </html>
            `
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockHtml),
            })

            const settings: Partial<Settings> = { enableNavigation: false }
            const result = await deepwikiProvider.mentions({ query: 'facebook/react' }, settings)

            expect(result).toHaveLength(1)
            expect(result[0].title).toContain('Overview')
            expect(result[0]?.data?.isNavigation).toBe(false)
        })
    })

    describe('items', () => {
        test('returns empty array when no mention data', async () => {
            const params: ItemsParams = {}
            const result = await deepwikiProvider.items(params, {})
            expect(result).toEqual([])
        })

        test('returns empty array when mention data has no content', async () => {
            const params: ItemsParams = {
                mention: {
                    title: 'Test',
                    uri: 'test',
                    data: {},
                },
            }
            const result = await deepwikiProvider.items(params, {})
            expect(result).toEqual([])
        })

        test('handles error items correctly', async () => {
            const params: ItemsParams = {
                mention: {
                    title: 'Error: Test Error',
                    uri: '',
                    data: {
                        content: 'Error occurred: Test error message',
                        isError: true,
                    },
                },
            }

            const result = await deepwikiProvider.items(params, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('Error: Test Error')
            expect(result[0].ai?.content).toBe('Error occurred: Test error message')
        })

        test('handles navigation items correctly', async () => {
            const params: ItemsParams = {
                mention: {
                    title: 'facebook/react Wiki Navigation',
                    uri: 'https://deepwiki.com/facebook/react',
                    data: {
                        content: 'This is the wiki for facebook/react...',
                        isNavigation: true,
                    },
                },
            }

            const result = await deepwikiProvider.items(params, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('facebook/react Wiki Navigation')
            expect(result[0].url).toBe('https://deepwiki.com/facebook/react')
            expect(result[0].ui?.hover?.text).toBe('AI-assisted wiki page selection')
            expect(result[0].ai?.content).toContain('This is the wiki for facebook/react')
        })

        test('handles normal page items correctly', async () => {
            const params: ItemsParams = {
                mention: {
                    title: 'API Reference',
                    uri: 'https://deepwiki.com/facebook/react',
                    data: {
                        content: '# API Reference\n\nThis is the API documentation...',
                        isNavigation: false,
                    },
                },
            }

            const result = await deepwikiProvider.items(params, {})

            expect(result).toHaveLength(1)
            expect(result[0].title).toBe('API Reference')
            expect(result[0].url).toBe('https://deepwiki.com/facebook/react')
            expect(result[0].ai?.content).toContain('# API Reference')
        })
    })
})
