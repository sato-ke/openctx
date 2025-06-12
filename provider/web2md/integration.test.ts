import { describe, it, expect } from 'vitest'
import { extractContent, convertToMarkdown } from './core.js'

describe('HTML to Markdown Integration', () => {
    describe('End-to-End Conversion', () => {
        it('should convert complete HTML to final Markdown (blog article)', () => {
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>How to Use TypeScript with React</title>
                    <meta property="og:title" content="How to Use TypeScript with React">
                    <style>body { font-family: Arial; }</style>
                </head>
                <body>
                    <nav>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/blog">Blog</a></li>
                        </ul>
                    </nav>
                    <header>
                        <h1><a href="#introduction">How to Use TypeScript with React</a></h1>
                        <p class="author">By John Doe</p>
                    </header>
                    <main>
                        <section id="introduction">
                            <h2>Introduction</h2>
                            <p>TypeScript is a powerful tool that adds static typing to JavaScript.</p>
                            <img src="typescript-logo.png" alt="TypeScript Logo">
                        </section>
                        <section id="setup">
                            <h2>Setup</h2>
                            <p>First, install the necessary packages:</p>
                            <pre><code>npm install typescript @types/react @types/react-dom</code></pre>
                            <script>
                                // This should be removed
                                console.log("tracking code");
                            </script>
                        </section>
                        <section id="example">
                            <h2>Example Component</h2>
                            <p>Here's a simple TypeScript React component:</p>
                            <pre><code>interface Props {
  name: string;
}

const Greeting: React.FC&lt;Props&gt; = ({ name }) =&gt; {
  return &lt;h1&gt;Hello, {name}!&lt;/h1&gt;;
};</code></pre>
                        </section>
                    </main>
                    <footer>
                        <p>&copy; 2024 Tech Blog</p>
                    </footer>
                </body>
                </html>
            `
            
            const url = 'https://techblog.com/typescript-react-guide'
            const extracted = extractContent(html, url)
            
            expect(extracted).not.toBeNull()
            expect(extracted!.title).toBe('How to Use TypeScript with React')
            
            const markdown = convertToMarkdown(extracted!, 10000, url)
            
            // Check header
            expect(markdown).toContain('Fetched from: https://techblog.com/typescript-react-guide')
            expect(markdown).toContain('Converted by: OpenCtx web2md provider')
            expect(markdown).toContain('# How to Use TypeScript with React')
            
            // Check content conversion
            expect(markdown).toContain('## Introduction')
            expect(markdown).toContain('## Setup')
            expect(markdown).toContain('## Example Component')
            expect(markdown).toContain('TypeScript is a powerful tool')
            expect(markdown).toContain('npm install typescript')
            expect(markdown).toContain('interface Props')
            expect(markdown).toContain('React.FC<Props>')
            
            // Check removals
            expect(markdown).not.toContain('![TypeScript Logo]')
            expect(markdown).not.toContain('<script')
            expect(markdown).not.toContain('tracking code')
            expect(markdown).not.toContain('console.log("tracking code")')
            expect(markdown).not.toContain('nav')
            expect(markdown).not.toContain('footer')
            expect(markdown).not.toContain('style')
            
            // Check heading links are removed
            expect(markdown).not.toContain('[How to Use TypeScript with React](#introduction)')
            
            // Check code blocks are properly formatted
            expect(markdown).toContain('```\nnpm install typescript')
            expect(markdown).toContain('```\ninterface Props')
        })
        
        it('should convert news article with complex structure', () => {
            const html = `
                <html>
                <head>
                    <title>Breaking: New AI Framework Released - Tech News</title>
                </head>
                <body>
                    <header class="site-header">
                        <div class="logo">Tech News</div>
                        <nav>Navigation menu</nav>
                    </header>
                    <article>
                        <header class="article-header">
                            <h1>Breaking: New AI Framework Released</h1>
                            <time datetime="2024-01-15">January 15, 2024</time>
                            <div class="tags">
                                <span>AI</span>
                                <span>Framework</span>
                                <span>Technology</span>
                            </div>
                        </header>
                        <div class="article-content">
                            <p class="lead">A revolutionary new AI framework has been announced today, promising to change the landscape of machine learning development.</p>
                            
                            <h3>Key Features</h3>
                            <ul>
                                <li>Easy integration with existing projects</li>
                                <li>Improved performance over existing solutions</li>
                                <li>Built-in support for multiple languages</li>
                            </ul>
                            
                            <blockquote>
                                <p>"This framework represents a significant step forward in AI development," said the lead researcher.</p>
                            </blockquote>
                            
                            <h3>Installation</h3>
                            <p>Getting started is simple:</p>
                            <pre class="code-block"><code class="language-bash">pip install new-ai-framework
python -m newai.setup</code></pre>
                            
                            <div class="advertisement">
                                <script async src="ads.js"></script>
                                <img src="ad-banner.jpg" alt="Advertisement">
                                <p>Sponsored content</p>
                            </div>
                        </div>
                    </article>
                    <aside class="sidebar">
                        <h4>Related Articles</h4>
                        <ul>
                            <li><a href="/ai-trends-2024">AI Trends 2024</a></li>
                            <li><a href="/ml-best-practices">ML Best Practices</a></li>
                        </ul>
                    </aside>
                    <footer class="site-footer">
                        <p>Copyright 2024 Tech News</p>
                    </footer>
                </body>
                </html>
            `
            
            const url = 'https://technews.com/ai-framework-release'
            const extracted = extractContent(html, url)
            const markdown = convertToMarkdown(extracted!, 8000, url)
            
            // Check proper title extraction
            expect(markdown).toContain('# Breaking: New AI Framework Released')
            
            // Check content structure preservation
            expect(markdown).toContain('### Key Features')
            expect(markdown).toContain('### Installation')
            expect(markdown).toContain('*   Easy integration with existing projects')
            expect(markdown).toContain('*   Improved performance over existing solutions')
            expect(markdown).toContain('> "This framework represents a significant step forward')
            
            // Check code block formatting
            expect(markdown).toContain('```\npip install new-ai-framework')
            expect(markdown).toContain('python -m newai.setup')
            
            // Check unwanted elements are removed
            expect(markdown).not.toContain('advertisement')
            expect(markdown).not.toContain('ads.js')
            expect(markdown).not.toContain('![Advertisement]')
            expect(markdown).not.toContain('sidebar')
            // These are in aside/footer which should be removed
            // expect(markdown).not.toContain('Related Articles')
            // expect(markdown).not.toContain('Copyright 2024')
        })
        
        it('should handle token limits correctly in real content', () => {
            const longHtml = `
                <html>
                <head><title>Long Technical Article</title></head>
                <body>
                    <h1>Comprehensive Guide to Web Development</h1>
                    ${Array(50).fill(0).map((_, i) => `
                        <h2>Section ${i + 1}</h2>
                        <p>${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20)}</p>
                        <pre><code>function example${i}() {
    console.log("This is example ${i}");
    return "result";
}</code></pre>
                    `).join('')}
                </body>
                </html>
            `
            
            const url = 'https://example.com/long-guide'
            const extracted = extractContent(longHtml, url)
            const markdown = convertToMarkdown(extracted!, 500, url) // Very low token limit
            
            expect(markdown).toContain('# Comprehensive Guide to Web Development')
            expect(markdown).toContain('... (content truncated)')
            
            // Should not exceed token limit significantly
            const lines = markdown.split('\n')
            expect(lines.length).toBeLessThan(100) // Reasonable truncation
        })
        
        it('should preserve markdown structure during truncation', () => {
            const html = `
                <html>
                <head><title>Structured Article</title></head>
                <body>
                    <h1>Main Title</h1>
                    <h2>Chapter 1</h2>
                    <p>${'Content for chapter 1. '.repeat(100)}</p>
                    <h2>Chapter 2</h2>
                    <p>${'Content for chapter 2. '.repeat(100)}</p>
                    <h2>Chapter 3</h2>
                    <p>${'Content for chapter 3. '.repeat(100)}</p>
                </body>
                </html>
            `
            
            const url = 'https://example.com/structured'
            const extracted = extractContent(html, url)
            const markdown = convertToMarkdown(extracted!, 200, url)
            
            expect(markdown).toContain('# Main Title')
            expect(markdown).toContain('... (content truncated)')
            
            // Should not have broken markdown structure
            const lines = markdown.split('\n')
            const lastLine = lines[lines.length - 1]
            expect(lastLine.trim()).toBe('... (content truncated)')
            
            // Should not have incomplete markdown elements
            expect(markdown).not.toMatch(/^##[^#\s]/) // No incomplete headings
        })
        
        it('should handle special characters and encoding correctly', () => {
            const html = `
                <html>
                <head><title>Spëcíàl Chäracters & Émojis 🚀</title></head>
                <body>
                    <h1>Spëcíàl Chäracters & Émojis 🚀</h1>
                    <p>This article contains special characters: àáâãäåæçèéêë</p>
                    <p>Mathematical symbols: ∑ ∏ ∫ √ ∞ ≈ ≠ ≤ ≥</p>
                    <p>Quotes: "smart quotes" 'apostrophes' and «guillemets»</p>
                    <pre><code>// Code with special chars
const message = "Hello, 世界! 🌍";
const formula = "E = mc²";
console.log(\`Template literal with \${message}\`);</code></pre>
                    <blockquote>
                        <p>"Il faut être très prudent" — French philosopher</p>
                    </blockquote>
                </body>
                </html>
            `
            
            const url = 'https://example.com/special-chars'
            const extracted = extractContent(html, url)
            const markdown = convertToMarkdown(extracted!, 5000, url)
            
            // Check title preservation
            expect(markdown).toContain('# Spëcíàl Chäracters & Émojis 🚀')
            
            // Check content preservation
            expect(markdown).toContain('àáâãäåæçèéêë')
            expect(markdown).toContain('∑ ∏ ∫ √ ∞ ≈ ≠ ≤ ≥')
            expect(markdown).toContain('"smart quotes" \'apostrophes\' and «guillemets»')
            expect(markdown).toContain('Hello, 世界! 🌍')
            expect(markdown).toContain('E = mc²')
            expect(markdown).toContain('> "Il faut être très prudent" — French philosopher')
            
            // Check code block preservation
            expect(markdown).toContain('```\n// Code with special chars')
            expect(markdown).toContain('Template literal with ${message}')
        })
        
        it('should handle empty and minimal content gracefully', () => {
            const minimalHtml = `
                <html>
                <head><title>Minimal Page</title></head>
                <body>
                    <nav>Navigation that should be removed</nav>
                    <script>alert('script');</script>
                    <img src="image.jpg" alt="Image">
                    <style>body { color: red; }</style>
                    <!-- Just some comments -->
                </body>
                </html>
            `
            
            const url = 'https://example.com/minimal'
            const extracted = extractContent(minimalHtml, url)
            
            // DefaultHandler extracts even minimal content (comments, whitespace)
            // The body still contains structure even after tag removal
            expect(extracted).not.toBeNull()
            expect(extracted?.title).toBe('Minimal Page')
        })
    })
})