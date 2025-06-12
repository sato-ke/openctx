import type { TurndownRule } from '../types.js'

/**
 * Extracted content from a web page
 */
export interface ExtractedContent {
    title: string
    content: string
}

/**
 * Site handler interface
 */
export interface SiteHandler {
    /** URL pattern RegExp to match supported URLs */
    urlPattern: RegExp

    /** Extract content from HTML */
    extractContent(html: string): ExtractedContent | null

    /** Extract title from document */
    extractTitle(doc: Document): string | null

    /** Get Turndown rules for this site */
    getTurndownRules(): TurndownRule[]

    /** Get tags to remove completely */
    getRemoveTags?(): string[]
}

/**
 * Helper functions for site handlers
 */

/**
 * Parse HTML string into Document
 */
export function parseHTML(html: string): Document {
    const parser = new DOMParser()
    return parser.parseFromString(html, 'text/html')
}

/**
 * Extract content using CSS selector
 */
export function extractContentBySelector(doc: Document, selector: string): string {
    const element = doc.querySelector(selector)
    return element?.innerHTML || ''
}

/**
 * Get fallback title from document
 */
export function getFallbackTitle(doc: Document): string {
    return doc.title || 'Untitled'
}

