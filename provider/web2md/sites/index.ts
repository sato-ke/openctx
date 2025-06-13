import type { SiteHandler } from './base.js'
import { DefaultSiteHandler } from './default.js'
import { QiitaSiteHandler } from './qiita.js'

/**
 * All available site handlers
 */
const SITE_HANDLERS: SiteHandler[] = [
    // Specific site handlers (placed before DefaultSiteHandler for priority)
    new QiitaSiteHandler(),

    // DefaultSiteHandler should always be last (catches all URLs)
    new DefaultSiteHandler(),
]

/**
 * Find the appropriate site handler for a given URL
 */
export function findSiteHandler(url: string): SiteHandler {
    // Find the first handler that matches the URL
    const handler = SITE_HANDLERS.find(h => h.urlPattern.test(url))

    // This should never happen since DefaultSiteHandler matches everything,
    // but provide a fallback for type safety
    return handler || new DefaultSiteHandler()
}

/**
 * Get all available site handlers
 */
export function getAllSiteHandlers(): readonly SiteHandler[] {
    return SITE_HANDLERS
}

// Re-export types and classes for convenience
export type { SiteHandler, ExtractedContent } from './base.js'
export { DefaultSiteHandler } from './default.js'
export { QiitaSiteHandler } from './qiita.js'
