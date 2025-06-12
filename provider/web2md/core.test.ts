import { describe, it, expect } from 'vitest'
import { isValidUrl, countTokens, convertToMarkdown, extractContent, createTurndownService } from './core.js'
import type { ExtractedContent } from './sites/index.js'

describe('core', () => {
    describe('isValidUrl', () => {
        it('should return true for valid HTTP URLs', () => {
            expect(isValidUrl('http://example.com')).toBe(true)
            expect(isValidUrl('https://example.com')).toBe(true)
            expect(isValidUrl('https://example.com/path')).toBe(true)
            expect(isValidUrl('https://example.com/path?query=1')).toBe(true)
            expect(isValidUrl('https://example.com:8080/path')).toBe(true)
        })

        it('should return false for invalid URLs', () => {
            expect(isValidUrl('')).toBe(false)
            expect(isValidUrl('not a url')).toBe(false)
            expect(isValidUrl('ftp://example.com')).toBe(false)
            expect(isValidUrl('file:///etc/passwd')).toBe(false)
            expect(isValidUrl('javascript:alert("xss")')).toBe(false)
        })

        it('should return false for malformed URLs', () => {
            expect(isValidUrl('http://')).toBe(false)
            expect(isValidUrl('https://')).toBe(false)
            // Note: 'http://.' is actually valid according to URL constructor
            expect(isValidUrl('http:// ')).toBe(false)
        })
    })

    describe('countTokens', () => {
        it('should count tokens in simple text', () => {
            const text = 'Hello world'
            const tokens = countTokens(text)
            expect(tokens).toBeGreaterThan(0)
            expect(typeof tokens).toBe('number')
        })

        it('should count more tokens for longer text', () => {
            const shortText = 'Hello'
            const longText = 'This is a much longer text with many more words and tokens'

            expect(countTokens(longText)).toBeGreaterThan(countTokens(shortText))
        })

        it('should handle empty string', () => {
            expect(countTokens('')).toBe(0)
        })

        it('should handle special characters and code', () => {
            const codeText = 'const foo = () => { console.log("hello"); }'
            const tokens = countTokens(codeText)
            expect(tokens).toBeGreaterThan(0)
        })
    })

    describe('extractContent', () => {
        it('should use appropriate site handler for URL', () => {
            const html = `
                <html>
                <head><title>Test Title</title></head>
                <body>
                    <h1>Main Title</h1>
                    <p>Content goes here</p>
                </body>
                </html>
            `

            const result = extractContent(html, 'https://example.com/article')

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Main Title')
            expect(result?.content).toContain('Content goes here')
        })

        it('should throw error for empty content', () => {
            const html = '<html><body></body></html>'

            expect(() => {
                extractContent(html, 'https://example.com')
            }).toThrow('Could not extract content from the page')
        })

        it('should handle malformed HTML', () => {
            const html = '<html><body><h1>Title</h1><p>Content'

            const result = extractContent(html, 'https://example.com')

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Title')
        })
    })

    describe('createTurndownService', () => {
        it('should create turndown service with default handler rules', () => {
            const turndown = createTurndownService('https://example.com')

            expect(turndown).toBeDefined()
            expect(typeof turndown.turndown).toBe('function')
        })

        it('should apply remove tags', () => {
            const turndown = createTurndownService('https://example.com')
            const html = '<div><img src="test.jpg" alt="test"><script>alert("test")</script><p>Content</p></div>'

            const markdown = turndown.turndown(html)

            expect(markdown).not.toContain('img')
            expect(markdown).not.toContain('script')
            expect(markdown).toContain('Content')
        })

        it('should apply turndown rules', () => {
            const turndown = createTurndownService('https://example.com')
            const html = '<div><pre><code>console.log("test");</code></pre></div>'

            const markdown = turndown.turndown(html)

            expect(markdown).toContain('```')
            expect(markdown).toContain('console.log("test");')
        })

        it('should remove heading links', () => {
            const turndown = createTurndownService('https://example.com')
            const html = '<h1><a href="#section">Section Title</a></h1>'

            const markdown = turndown.turndown(html)

            expect(markdown).toContain('# Section Title')
            expect(markdown).not.toContain('[')
            expect(markdown).not.toContain('](#section)')
        })
    })

    describe('convertToMarkdown', () => {
        it('should convert extracted content to markdown with header', () => {
            const extractedContent: ExtractedContent = {
                title: 'Test Article',
                content: '<p>This is <strong>test</strong> content.</p>',
            }

            const markdown = convertToMarkdown(extractedContent, 10000, 'https://example.com/article')

            expect(markdown).toContain('Fetched from: https://example.com/article')
            expect(markdown).toContain('# Test Article')
            expect(markdown).toContain('This is **test** content.')
        })

        it('should truncate content when over token limit', () => {
            const longContent = '<p>' + 'A'.repeat(1000) + '</p>'
            const extractedContent: ExtractedContent = {
                title: 'Long Article',
                content: longContent,
            }

            const markdown = convertToMarkdown(extractedContent, 50, 'https://example.com')

            expect(markdown).toContain('... (content truncated)')
        })

        it('should handle empty content', () => {
            const extractedContent: ExtractedContent = {
                title: 'Empty Article',
                content: '',
            }

            const markdown = convertToMarkdown(extractedContent, 1000, 'https://example.com')

            expect(markdown).toContain('# Empty Article')
            expect(markdown).toContain('Fetched from: https://example.com')
        })

        it('should preserve structure when truncating', () => {
            const longContent = '<h2>Section 1</h2>' + '<p>' + 'A'.repeat(500) + '</p>' +
                '<h2>Section 2</h2>' + '<p>' + 'B'.repeat(500) + '</p>'
            const extractedContent: ExtractedContent = {
                title: 'Test',
                content: longContent,
            }

            const markdown = convertToMarkdown(extractedContent, 100, 'https://example.com')

            // Should truncate but not break markdown structure
            expect(markdown).toContain('... (content truncated)')
        })

        it('should handle special characters in title and URL', () => {
            const extractedContent: ExtractedContent = {
                title: 'Test & "Special" Characters',
                content: '<p>Content</p>',
            }

            const markdown = convertToMarkdown(extractedContent, 1000, 'https://example.com/special?q=test&sort=date')

            expect(markdown).toContain('# Test & "Special" Characters')
            expect(markdown).toContain('https://example.com/special?q=test&sort=date')
        })
    })
})
