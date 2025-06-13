import { parseHTML, extractContentBySelector, getFallbackTitle } from './base.js'
import type { SiteHandler, ExtractedContent } from './base.js'
import type { TurndownRule } from '../types.js'
import { COMMON_RULES } from '../common/rules.js'

/**
 * Qiita site handler
 * Optimized for Qiita article pages with better content extraction
 */
export class QiitaSiteHandler implements SiteHandler {
    /** Matches Qiita article URLs */
    urlPattern = /^https:\/\/qiita\.com\/[\w-]+\/items\/[\w-]+/

    extractContent(html: string): ExtractedContent | null {
        const doc = parseHTML(html)

        // Try multiple Qiita-specific content selectors
        const selectors = [
            '.it-MdContent',
            '#personal-public-article-body',
            '.p-article_body', 
            '[data-testid="article-body"]',
            'article .markdown-body',
            'article',
            'main'
        ]

        let content = ''

        for (const selector of selectors) {
            content = extractContentBySelector(doc, selector)
            if (content.trim()) {
                break
            }
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
        // Try Qiita-specific title selectors
        const selectors = [
            'h1.it-ArticleHeader_title',
            '.p-article_title h1',
            'h1[data-testid="article-title"]',
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
            // Remove common Qiita suffixes
            return title.replace(/\s*-\s*Qiita$/, '').trim()
        }

        return null
    }

    getTurndownRules(): TurndownRule[] {
        return [
            COMMON_RULES.removeHeadingLinks,
            COMMON_RULES.defaultCodeBlocks,
            COMMON_RULES.removeImages,
            // Qiita-specific rules
            {
                name: 'qiitaCodeBlocks',
                filter: (node: Node) => {
                    return node.nodeType === Node.ELEMENT_NODE &&
                        (node as Element).classList.contains('code-frame')
                },
                replacement: (content: string, node: Node) => {
                    const codeFrame = node as HTMLElement
                    
                    // Extract language from data-lang attribute
                    const language = codeFrame.getAttribute('data-lang') || ''
                    
                    // Extract filename if present
                    const filename = codeFrame.querySelector('.code-frame-filename')?.textContent?.trim()
                    
                    // Extract code content
                    const codeContent = codeFrame.querySelector('code')?.textContent || content

                    // Build language identifier for markdown
                    let langIdentifier = language
                    if (filename) {
                        langIdentifier = filename // filename takes precedence for display
                    }

                    return `\n\`\`\`${langIdentifier}\n${codeContent.trim()}\n\`\`\`\n`
                },
            },
            {
                name: 'qiitaQuotes',
                filter: (node: Node) => {
                    return node.nodeType === Node.ELEMENT_NODE &&
                        (node as Element).classList.contains('type-quote')
                },
                replacement: (content: string) => {
                    return `\n> ${content.trim()}\n`
                },
            },
        ]
    }

    getRemoveTags(): string[] {
        return [
            // Only remove ads and scripts (content selector already filters UI)
            'script',
            'style',
            '.google-auto-placed',
            '.adsbygoogle',
            '[class*="advertisement"]',
            '[id*="ad"]',
        ]
    }
}
