import { describe, it, expect } from 'vitest'
import { QiitaSiteHandler } from './qiita.js'

describe('QiitaSiteHandler', () => {
    const handler = new QiitaSiteHandler()

    describe('urlPattern', () => {
        it('should match valid Qiita article URLs', () => {
            const validUrls = [
                'https://qiita.com/user123/items/abc123def',
                'https://qiita.com/test-user/items/test-item-id',
                'https://qiita.com/qnighy/items/4bbbb20e71cf4ae527b9',
            ]

            for (const url of validUrls) {
                expect(handler.urlPattern.test(url)).toBe(true)
            }
        })

        it('should not match invalid URLs', () => {
            const invalidUrls = [
                'https://qiita.com/',
                'https://qiita.com/trending',
                'https://qiita.com/user123',
                'https://example.com',
                'https://zenn.dev/articles/123',
                'http://qiita.com/user/items/123', // http instead of https
            ]

            for (const url of invalidUrls) {
                expect(handler.urlPattern.test(url)).toBe(false)
            }
        })
    })

    describe('extractContent', () => {
        it('should extract content from Qiita article with .it-MdContent', () => {
            const html = `
                <html>
                <head><title>Test Article - Qiita</title></head>
                <body>
                    <div class="it-MdContent">
                        <h1>Article Title</h1>
                        <p>This is the main content of the article.</p>
                        <pre class="code-frame">
                            <div class="code-frame-filename">example.js</div>
                            <code>console.log('Hello, World!');</code>
                        </pre>
                    </div>
                    <aside class="it-ArticleUserInfo">Author info</aside>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Article Title')
            expect(result?.content).toContain('Article Title')
            expect(result?.content).toContain('main content of the article')
            expect(result?.content).toContain('example.js')
        })

        it('should fallback to article selector', () => {
            const html = `
                <html>
                <head><title>Fallback Test - Qiita</title></head>
                <body>
                    <article>
                        <h1>Fallback Article</h1>
                        <p>Content in article tag.</p>
                    </article>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Fallback Article')
            expect(result?.content).toContain('Fallback Article')
            expect(result?.content).toContain('Content in article tag')
        })

        it('should fallback to main selector', () => {
            const html = `
                <html>
                <head><title>Main Fallback - Qiita</title></head>
                <body>
                    <main>
                        <h1>Main Content</h1>
                        <p>Content in main tag.</p>
                    </main>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).not.toBeNull()
            expect(result?.title).toBe('Main Content')
            expect(result?.content).toContain('Main Content')
        })

        it('should return null for empty content', () => {
            const html = `
                <html>
                <head><title>Empty - Qiita</title></head>
                <body>
                    <div class="it-MdContent"></div>
                </body>
                </html>
            `

            const result = handler.extractContent(html)

            expect(result).toBeNull()
        })
    })

    describe('extractTitle', () => {
        it('should extract title from h1.it-ArticleHeader_title', () => {
            const html = `
                <html>
                <body>
                    <h1 class="it-ArticleHeader_title">Specific Qiita Title</h1>
                </body>
                </html>
            `

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const title = handler.extractTitle(doc)

            expect(title).toBe('Specific Qiita Title')
        })

        it('should extract title from og:title meta tag', () => {
            const html = `
                <html>
                <head>
                    <meta property="og:title" content="OG Title for Qiita">
                    <title>Page Title - Qiita</title>
                </head>
                <body></body>
                </html>
            `

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const title = handler.extractTitle(doc)

            expect(title).toBe('OG Title for Qiita')
        })

        it('should remove Qiita suffix from title tag', () => {
            const html = `
                <html>
                <head><title>Article Title - Qiita</title></head>
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
        it('should include common rules and Qiita-specific rules', () => {
            const rules = handler.getTurndownRules()

            expect(rules.length).toBeGreaterThan(2)
            
            const ruleNames = rules.map(r => r.name)
            expect(ruleNames).toContain('removeHeadingLinks')
            expect(ruleNames).toContain('defaultCodeBlocks')
            expect(ruleNames).toContain('qiitaCodeBlocks')
            expect(ruleNames).toContain('qiitaQuotes')
            expect(ruleNames).toContain('removeImages')
        })

        it('should convert Qiita code blocks with language from data-lang', () => {
            const html = `<div class="code-frame" data-lang="rust"><div class="highlight"><pre><code>fn main() {
    println!("Hello, world!");
}</code></pre></div></div>`

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const codeFrame = doc.querySelector('.code-frame')!
            
            const rules = handler.getTurndownRules()
            const qiitaCodeRule = rules.find(r => r.name === 'qiitaCodeBlocks')!
            const markdown = qiitaCodeRule.replacement('', codeFrame)

            expect(markdown).toContain('```rust')
            expect(markdown).toContain('fn main() {')
            expect(markdown).toContain('println!("Hello, world!");')
        })

        it('should convert Qiita code blocks with filename taking precedence', () => {
            const html = `<div class="code-frame" data-lang="rust">
                <div class="code-frame-filename">main.rs</div>
                <div class="highlight"><pre><code>fn main() {}</code></pre></div>
            </div>`

            const doc = new DOMParser().parseFromString(html, 'text/html')
            const codeFrame = doc.querySelector('.code-frame')!
            
            const rules = handler.getTurndownRules()
            const qiitaCodeRule = rules.find(r => r.name === 'qiitaCodeBlocks')!
            const markdown = qiitaCodeRule.replacement('', codeFrame)

            expect(markdown).toContain('```main.rs')
            expect(markdown).toContain('fn main() {}')
        })
    })

    describe('getRemoveTags', () => {
        it('should include scripts, styles, and ads remove tags', () => {
            const tags = handler.getRemoveTags()

            // Scripts and styles
            expect(tags).toContain('script')
            expect(tags).toContain('style')

            // Ads
            expect(tags).toContain('.google-auto-placed')
            expect(tags).toContain('.adsbygoogle')
            expect(tags).toContain('[class*="advertisement"]')
            expect(tags).toContain('[id*="ad"]')
        })
    })
})