import { describe, it, expect } from 'vitest'
import { DefaultSiteHandler } from './default.js'

describe('DefaultSiteHandler', () => {
    let handler: DefaultSiteHandler
    
    beforeEach(() => {
        handler = new DefaultSiteHandler()
    })
    
    describe('urlPattern', () => {
        it('should match any URL', () => {
            expect(handler.urlPattern.test('https://example.com')).toBe(true)
            expect(handler.urlPattern.test('http://test.org/article/123')).toBe(true)
            expect(handler.urlPattern.test('https://blog.com/posts/hello-world')).toBe(true)
            expect(handler.urlPattern.test('file:///local/file.html')).toBe(true)
            expect(handler.urlPattern.test('ftp://files.com/doc.txt')).toBe(true)
            expect(handler.urlPattern.test('')).toBe(true)
            expect(handler.urlPattern.test('not-a-url')).toBe(true)
        })
    })
    
    describe('extractTitle', () => {
        it('should extract title from h1 (highest priority)', () => {
            const html = `
                <html>
                <head>
                    <title>Document Title</title>
                    <meta property="og:title" content="OG Title">
                    <meta name="title" content="Meta Title">
                </head>
                <body>
                    <h1>H1 Title</h1>
                    <p>Content</p>
                </body>
                </html>
            `
            const doc = new DOMParser().parseFromString(html, 'text/html')
            expect(handler.extractTitle(doc)).toBe('H1 Title')
        })
        
        it('should extract title from og:title when h1 is not available', () => {
            const html = `
                <html>
                <head>
                    <title>Document Title</title>
                    <meta property="og:title" content="OG Title">
                    <meta name="title" content="Meta Title">
                </head>
                <body>
                    <p>Content without h1</p>
                </body>
                </html>
            `
            const doc = new DOMParser().parseFromString(html, 'text/html')
            expect(handler.extractTitle(doc)).toBe('OG Title')
        })
        
        it('should extract title from meta title when h1 and og:title are not available', () => {
            const html = `
                <html>
                <head>
                    <title>Document Title</title>
                    <meta name="title" content="Meta Title">
                </head>
                <body>
                    <p>Content</p>
                </body>
                </html>
            `
            const doc = new DOMParser().parseFromString(html, 'text/html')
            expect(handler.extractTitle(doc)).toBe('Meta Title')
        })
        
        it('should return null when no title sources are available', () => {
            const html = `
                <html>
                <body>
                    <p>Content with no title elements</p>
                </body>
                </html>
            `
            const doc = new DOMParser().parseFromString(html, 'text/html')
            expect(handler.extractTitle(doc)).toBeNull()
        })
        
        it('should trim whitespace from extracted titles', () => {
            const html = `
                <html>
                <body>
                    <h1>   Whitespace Title   </h1>
                </body>
                </html>
            `
            const doc = new DOMParser().parseFromString(html, 'text/html')
            expect(handler.extractTitle(doc)).toBe('Whitespace Title')
        })
        
        it('should handle empty title elements', () => {
            const html = `
                <html>
                <head>
                    <meta property="og:title" content="   ">
                    <meta name="title" content="">
                </head>
                <body>
                    <h1></h1>
                </body>
                </html>
            `
            const doc = new DOMParser().parseFromString(html, 'text/html')
            expect(handler.extractTitle(doc)).toBeNull()
        })
    })
    
    describe('extractContent', () => {
        it('should extract content from body', () => {
            const html = `
                <html>
                <head><title>Test</title></head>
                <body>
                    <header>Header content</header>
                    <main>
                        <h1>Article Title</h1>
                        <p>This is the main content.</p>
                        <pre><code>console.log('code');</code></pre>
                    </main>
                    <footer>Footer content</footer>
                </body>
                </html>
            `
            
            const result = handler.extractContent(html)
            
            expect(result).not.toBeNull()
            expect(result?.title).toBe('Article Title')
            expect(result?.content).toContain('This is the main content')
            expect(result?.content).toContain('console.log')
            expect(result?.content).toContain('Header content')
            expect(result?.content).toContain('Footer content')
        })
        
        it('should use fallback title when extractTitle returns null', () => {
            const html = `
                <html>
                <head><title>Fallback Title</title></head>
                <body>
                    <p>Content without extractable title</p>
                </body>
                </html>
            `
            
            const result = handler.extractContent(html)
            
            expect(result?.title).toBe('Fallback Title')
        })
        
        it('should return null when body is empty', () => {
            const html = `
                <html>
                <head><title>Test</title></head>
                <body></body>
                </html>
            `
            
            const result = handler.extractContent(html)
            
            expect(result).toBeNull()
        })
        
        it('should return null when body contains only whitespace', () => {
            const html = `
                <html>
                <head><title>Test</title></head>
                <body>   
                    
                </body>
                </html>
            `
            
            const result = handler.extractContent(html)
            
            expect(result).toBeNull()
        })
        
        it('should handle malformed HTML gracefully', () => {
            const html = `
                <html>
                <body>
                    <h1>Title</h1>
                    <p>Content without closing tags
                    <div>More content
                </body>
            `
            
            const result = handler.extractContent(html)
            
            expect(result).not.toBeNull()
            expect(result?.title).toBe('Title')
            expect(result?.content).toContain('Content without closing tags')
        })
        
        it('should extract content from various blog-like structures', () => {
            const html = `
                <html>
                <body>
                    <nav>Navigation</nav>
                    <article>
                        <header>
                            <h1>Blog Post Title</h1>
                            <time>2024-01-01</time>
                        </header>
                        <section>
                            <p>Blog post content goes here.</p>
                            <blockquote>Important quote</blockquote>
                        </section>
                    </article>
                    <aside>Sidebar</aside>
                </body>
                </html>
            `
            
            const result = handler.extractContent(html)
            
            expect(result?.title).toBe('Blog Post Title')
            expect(result?.content).toContain('Blog post content')
            expect(result?.content).toContain('Important quote')
        })
    })
    
    describe('getTurndownRules', () => {
        it('should return expected rules array', () => {
            const rules = handler.getTurndownRules()
            
            expect(rules).toHaveLength(2)
            expect(rules.map(r => r.name)).toEqual([
                'removeHeadingLinks',
                'defaultCodeBlocks'
            ])
        })
    })
    
    describe('getRemoveTags', () => {
        it('should return expected remove tags', () => {
            const tags = handler.getRemoveTags()
            
            expect(tags).toEqual(['img', 'script', 'style', 'nav', 'header', 'footer'])
        })
    })
})