import { parseHTML, extractContentBySelector, getFallbackTitle } from './base.js'
import type { SiteHandler, ExtractedContent } from './base.js'
import type { TurndownRule } from '../types.js'
import { COMMON_RULES } from '../common/rules.js'

/**
 * Zenn site handler
 * Optimized for Zenn article and book pages with better content extraction
 */
export class ZennSiteHandler implements SiteHandler {
    /** Matches Zenn article and book URLs */
    urlPattern = /^https:\/\/zenn\.dev\/[\w-]+\/(articles|books)\/[\w-]+/

    extractContent(html: string): ExtractedContent | null {
        const doc = parseHTML(html)

        // First, try to extract from __NEXT_DATA__ (recommended approach for Zenn)
        const nextDataScript = doc.querySelector('#__NEXT_DATA__')
        if (nextDataScript?.textContent) {
            try {
                const data = JSON.parse(nextDataScript.textContent)
                const article = data?.props?.pageProps?.article

                if (article?.bodyHtml && article?.title) {
                    return {
                        title: article.title,
                        content: article.bodyHtml,
                    }
                }
            } catch (error) {
                console.warn('[web2md] Failed to parse __NEXT_DATA__:', error)
            }
        }

        // Fallback to DOM-based extraction
        // Try Zenn-specific content selector first
        let content = extractContentBySelector(doc, '.znc')

        // Fallback to article content
        if (!content.trim()) {
            content = extractContentBySelector(doc, 'article')
        }

        // Last resort: main content area
        if (!content.trim()) {
            content = extractContentBySelector(doc, 'main')
        }

        if (!content.trim()) {
            return null
        }

        const title = this.extractTitle(doc) || getFallbackTitle(doc)

        return {
            title,
            content,
        }
    }

    extractTitle(doc: Document): string | null {
        // Try Zenn-specific title selectors
        const selectors = [
            'h1[data-testid="article-title"]',
            '.View_title__VsTaR',
            'article h1',
            'h1', // fallback
        ]

        for (const selector of selectors) {
            const element = doc.querySelector(selector)
            if (element?.textContent?.trim()) {
                return element.textContent.trim()
            }
        }

        // Try meta tags
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
        if (ogTitle?.trim()) {
            return ogTitle.trim()
        }

        const title = doc.querySelector('title')?.textContent?.trim()
        if (title) {
            // Remove common Zenn suffixes
            return title.replace(/\s*\|\s*Zenn$/, '').trim()
        }

        return null
    }

    getTurndownRules(): TurndownRule[] {
        return [
            COMMON_RULES.removeHeadingLinks,
            COMMON_RULES.defaultCodeBlocks,
            COMMON_RULES.removeImages,
            // Zenn-specific rules
            {
                name: 'zennCodeBlocks',
                filter: (node: Node) => {
                    return node.nodeType === Node.ELEMENT_NODE &&
                        (node as Element).tagName === 'PRE' &&
                        !!(node as Element).querySelector('code')
                },
                replacement: (content: string, node: Node) => {
                    const pre = node as HTMLElement
                    const code = pre.querySelector('code')
                    const codeContent = code?.textContent || content.trim()

                    // Try to extract language from class
                    const langClass = code?.className.match(/language-(\w+)/)
                    const lang = langClass ? langClass[1] : ''

                    return `\n\`\`\`${lang}\n${codeContent}\n\`\`\`\n`
                },
            },
            {
                name: 'zennCallouts',
                filter: (node: Node) => {
                    return node.nodeType === Node.ELEMENT_NODE &&
                        (node as Element).classList.contains('msg')
                },
                replacement: (content: string, node: Node) => {
                    const element = node as HTMLElement
                    const type = element?.classList.contains('alert') ? '🚨' :
                                element?.classList.contains('message') ? 'ℹ️' : '💡'
                    return `\n> ${type} ${content.trim()}\n`
                },
            },
        ]
    }

    getRemoveTags(): string[] {
        return [
            // Common elements
            // 'nav',
            // 'header[role="banner"]',
            // 'footer[role="contentinfo"]',
            // 'aside',
            // 'script',
            // 'style',
            // Ads and tracking
            '.google-auto-placed',
            '.adsbygoogle',
            '[class*="advertisement"]',
            '[id*="ad"]',
        ]
    }
}
