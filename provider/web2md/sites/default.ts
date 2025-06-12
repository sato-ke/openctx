import type { SiteHandler, ExtractedContent } from './base.js'
import type { TurndownRule } from '../types.js'
import { parseHTML, extractContentBySelector, getFallbackTitle } from './base.js'
import { COMMON_RULES } from '../common/rules.js'

/**
 * Default site handler for unsupported sites
 * Attempts to extract content from body and title from common elements
 */
export class DefaultSiteHandler implements SiteHandler {
    /** Matches any URL */
    urlPattern = /.*/

    extractContent(html: string): ExtractedContent | null {
        const doc = parseHTML(html)
        const content = extractContentBySelector(doc, 'body')

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
        // Try h1 first
        const h1 = doc.querySelector('h1')
        if (h1?.textContent?.trim()) {
            return h1.textContent.trim()
        }

        // Try meta og:title
        const ogTitle = doc.querySelector('meta[property="og:title"]')
        if (ogTitle) {
            const content = ogTitle.getAttribute('content')
            if (content?.trim()) {
                return content.trim()
            }
        }

        // Try meta title
        const metaTitle = doc.querySelector('meta[name="title"]')
        if (metaTitle) {
            const content = metaTitle.getAttribute('content')
            if (content?.trim()) {
                return content.trim()
            }
        }

        return null
    }

    getTurndownRules(): TurndownRule[] {
        return [
            COMMON_RULES.removeHeadingLinks,
            COMMON_RULES.defaultCodeBlocks,
        ]
    }

    getRemoveTags(): string[] {
        return ['img', 'script', 'style', 'nav', 'header', 'footer']
    }
}
