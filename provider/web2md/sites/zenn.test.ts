import { describe, it, expect } from 'vitest'
import { ZennSiteHandler } from './zenn.js'

describe('ZennSiteHandler', () => {
    const handler = new ZennSiteHandler()

    describe('urlPattern', () => {
        it('should match valid Zenn article URLs', () => {
            const validUrls = [
                'https://zenn.dev/user123/articles/article-id',
                'https://zenn.dev/test-user/articles/test-article',
                'https://zenn.dev/pepabo/articles/99042d27d6cf3b',
            ]

            for (const url of validUrls) {
                expect(handler.urlPattern.test(url)).toBe(true)
            }
        })

        it('should match valid Zenn book URLs', () => {
            const validUrls = [
                'https://zenn.dev/user123/books/book-id',
                'https://zenn.dev/test-user/books/test-book',
            ]

            for (const url of validUrls) {
                expect(handler.urlPattern.test(url)).toBe(true)
            }
        })

        it('should not match invalid URLs', () => {
            const invalidUrls = [
                'https://zenn.dev/',
                'https://zenn.dev/trending',
                'https://zenn.dev/user123',
                'https://example.com',
                'https://qiita.com/user/items/123',
                'http://zenn.dev/user/articles/123', // http instead of https
            ]

            for (const url of invalidUrls) {
                expect(handler.urlPattern.test(url)).toBe(false)
            }
        })
    })

    describe('extractContent', () => {
        it('should extract content from __NEXT_DATA__ JSON', () => {
            const html = `
                <html>
                <head><title>Test Article - Zenn</title></head>
                <body>
                    <script id="__NEXT_DATA__" type="application/json">
                    {
                        "props": {
                            "pageProps": {
                                "article": {
                                    "title": "Next.js Article Title",
                                    "bodyHtml": "<h1>Content from JSON</h1><p>This is the article body from JSON.</p>"
                                }
                            }
                        }
                    }
                    </script>
                    <div class="znc">
                        <h1>DOM Content</h1>
                        <p>This should not be used when JSON is available.</p>
                    </div>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Next.js Article Title')
            expect(result?.content).toContain('Content from JSON')
            expect(result?.content).toContain('This is the article body from JSON')
            expect(result?.content).not.toContain('DOM Content')
        })

        it('should fallback to .znc selector when __NEXT_DATA__ is not available', () => {
            const html = `
                <html>
                <head><title>Fallback Test - Zenn</title></head>
                <body>
                    <div class="znc">
                        <h1>Zenn Article</h1>
                        <p>Content from DOM selector.</p>
                    </div>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Zenn Article')
            expect(result?.content).toContain('Zenn Article')
            expect(result?.content).toContain('Content from DOM selector')
        })

        it('should handle invalid __NEXT_DATA__ JSON gracefully', () => {
            const html = `
                <html>
                <head><title>Invalid JSON Test - Zenn</title></head>
                <body>
                    <script id="__NEXT_DATA__" type="application/json">
                    { invalid json }
                    </script>
                    <article>
                        <h1>Fallback Article</h1>
                        <p>Should use DOM extraction when JSON is invalid.</p>
                    </article>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Fallback Article')
            expect(result?.content).toContain('Should use DOM extraction')
        })

        it('should return null for empty content', () => {
            const html = `
                <html>
                <head><title>Empty - Zenn</title></head>
                <body>
                    <div class="znc"></div>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).toBeNull()
        })
    })

    describe('extractTitle', () => {
        it('should extract title from data-testid="article-title"', () => {
            const html = `
                <html>
                <body>
                    <h1 data-testid="article-title">Specific Zenn Title</h1>
                </body>
                </html>
            `

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const title = handler.extractTitle(doc)

            expect(title).toBe('Specific Zenn Title')
        })

        it('should extract title from og:title meta tag', () => {
            const html = `
                <html>
                <head>
                    <meta property="og:title" content="OG Title for Zenn">
                    <title>Page Title | Zenn</title>
                </head>
                <body></body>
                </html>
            `

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const title = handler.extractTitle(doc)

            expect(title).toBe('OG Title for Zenn')
        })

        it('should remove Zenn suffix from title tag', () => {
            const html = `
                <html>
                <head><title>Article Title | Zenn</title></head>
                <body></body>
                </html>
            `

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const title = handler.extractTitle(doc)

            expect(title).toBe('Article Title')
        })

        it('should return null for missing title', () => {
            const html = `
                <html>
                <head></head>
                <body></body>
                </html>
            `

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const title = handler.extractTitle(doc)

            expect(title).toBeNull()
        })
    })

    describe('getTurndownRules', () => {
        it('should include common rules and Zenn-specific rules', () => {
            const rules = handler.getTurndownRules()

            expect(rules.length).toBeGreaterThan(2)

            const ruleNames = rules.map(r => r.name)
            expect(ruleNames).toContain('removeHeadingLinks')
            expect(ruleNames).toContain('defaultCodeBlocks')
            expect(ruleNames).toContain('zennCodeBlocks')
            expect(ruleNames).toContain('zennCallouts')
            expect(ruleNames).toContain('removeImages')
        })

        it('should convert Zenn code blocks with language detection', () => {
            const html = `<pre><code class="language-typescript">const x = 1;</code></pre>`

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const preElement = doc.querySelector('pre')!

            const rules = handler.getTurndownRules()
            const zennCodeRule = rules.find(r => r.name === 'zennCodeBlocks')!
            const markdown = zennCodeRule.replacement('', preElement)

            expect(markdown).toContain('```typescript')
            expect(markdown).toContain('const x = 1;')
        })

        it('should convert Zenn callouts with appropriate icons', () => {
            const htmlAlert = `<div class="msg alert">Alert message</div>`
            const htmlMessage = `<div class="msg message">Info message</div>`
            const htmlDefault = `<div class="msg">Default message</div>`

            const doc = new DOMParser().parseFromString(htmlAlert + htmlMessage + htmlDefault, 'text/html')

            const rules = handler.getTurndownRules()
            const calloutRule = rules.find(r => r.name === 'zennCallouts')!

            const alertElement = doc.querySelector('.msg.alert')!
            const messageElement = doc.querySelector('.msg.message')!
            const defaultElement = doc.querySelector('.msg:not(.alert):not(.message)')!

            expect(calloutRule.replacement('Alert message', alertElement)).toContain('> 🚨 Alert message')
            expect(calloutRule.replacement('Info message', messageElement)).toContain('> ℹ️ Info message')
            expect(calloutRule.replacement('Default message', defaultElement)).toContain('> 💡 Default message')
        })
    })

})
