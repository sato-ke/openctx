import type { Item } from '@openctx/provider'

/**
 * Provider settings
 */
export interface Settings {
    /** User-Agent header for HTTP requests */
    userAgent: string
    /** Request timeout in milliseconds */
    requestTimeout: number
    /** Maximum content length in tokens */
    maxTokens: number
    /** Whether to save markdown files locally */
    saveLocal?: boolean
    /** Directory name to save files (relative to workspace root) */
    saveDirectory?: string
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
    userAgent: 'openctx-web2md/1.0.0',
    requestTimeout: 10000,
    maxTokens: 6000,
    saveLocal: false,
    saveDirectory: '.web2md-output',
}

/**
 * Turndown rule definition
 */
export interface TurndownRule {
    name: string
    filter: (keyof HTMLElementTagNameMap)[] | keyof HTMLElementTagNameMap | ((node: Node) => boolean)
    replacement: (content: string, node: Node) => string
}

/**
 * Error types
 */
export enum ErrorType {
    INVALID_URL = 'INVALID_URL',
    NETWORK_ERROR = 'NETWORK_ERROR',
    CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
    CONVERSION_ERROR = 'CONVERSION_ERROR',
}

/**
 * Result of web page fetch
 */
export interface FetchResult {
    html: string
    url: string
    statusCode: number
}

/**
 * Result of content extraction
 */
export interface ExtractedContent {
    title: string
    content: string
    url: string
}

/**
 * Create error item
 */
export function createErrorItem(error: ErrorType, message: string, url?: string): Item {
    return {
        title: `Error: ${error}`,
        ai: {
            content: message,
        },
        url,
    }
}
