import TurndownService from 'turndown'
import { encode } from 'gpt-tokenizer'
import { findSiteHandler, type ExtractedContent } from './sites/index.js'

/**
 * Validate if URL is supported
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url)
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Extract content from HTML using site handlers
 */
export function extractContent(html: string, url: string): ExtractedContent {
    const handler = findSiteHandler(url)
    const result = handler.extractContent(html)
    if (!result) {
        throw new Error('Could not extract content from the page')
    }
    return result
}

/**
 * Create Turndown service with custom rules
 */
export function createTurndownService(url: string): TurndownService {
    const handler = findSiteHandler(url)
    
    const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
    })
    
    // Apply handler rules
    const rules = handler.getTurndownRules()
    for (const rule of rules) {
        turndown.addRule(rule.name, {
            filter: rule.filter,
            replacement: rule.replacement,
        })
    }
    
    return turndown
}

/**
 * Count tokens in a string
 */
export function countTokens(text: string): number {
    return encode(text).length
}

/**
 * Truncate Markdown content while preserving structure
 */
function truncateMarkdown(content: string, maxTokens: number): string {
    const lines = content.split('\n')
    let result: string[] = []
    let currentTokens = 0
    
    for (const line of lines) {
        const lineTokens = countTokens(line + '\n')
        if (currentTokens + lineTokens > maxTokens) {
            // Add truncation notice
            result.push('\n... (content truncated)')
            break
        }
        result.push(line)
        currentTokens += lineTokens
    }
    
    return result.join('\n')
}

/**
 * Remove unwanted elements from HTML
 */
function preprocessHtml(html: string, removeTags: string[]): string {
    if (removeTags.length === 0) return html
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Remove specified tags
    for (const tag of removeTags) {
        const elements = doc.querySelectorAll(tag)
        elements.forEach(el => el.remove())
    }
    
    return doc.body.innerHTML
}

/**
 * Convert HTML to Markdown
 */
export function convertToMarkdown(extractedContent: ExtractedContent, maxTokens: number, url: string): string {
    const handler = findSiteHandler(url)
    const removeTags = handler.getRemoveTags?.() || []
    
    // Preprocess HTML to remove unwanted tags
    const cleanedContent = preprocessHtml(extractedContent.content, removeTags)
    
    const turndown = createTurndownService(url)
    const markdown = turndown.turndown(cleanedContent)
    
    // Build final content
    const header = `<!--
Fetched from: ${url}
Converted by: OpenCtx web2md provider
Processing: Removed images, scripts, and normalized code blocks using Turndown
-->

# ${extractedContent.title}

`
    
    const fullContent = header + markdown
    const fullTokens = countTokens(fullContent)
    
    // Truncate if necessary
    if (fullTokens > maxTokens) {
        return truncateMarkdown(fullContent, maxTokens)
    }
    
    return fullContent
}