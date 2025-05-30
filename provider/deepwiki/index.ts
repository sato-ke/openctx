import type {
    ItemsParams,
    ItemsResult,
    MentionsParams,
    MentionsResult,
    MetaParams,
    MetaResult,
    Provider,
} from '@openctx/provider'
import { createErrorItem, debounce, fetchDeepwikiHTML } from './api.js'
import {
    applySizeLimit,
    filterPagesByPageNumbers,
    filterPagesByQuery,
    generateNavigation,
    parseHTMLToMarkdown,
    parseInputQuery,
} from './core.js'
import type { DeepwikiMentionData, Settings } from './types.js'
import { DEFAULT_SETTINGS, SETTINGS_LIMITS } from './types.js'

/**
 * Validate and normalize settings
 * @param settings - Partial settings from user
 * @returns Validated and normalized settings
 */
export function validateSettings(settings: Partial<Settings>): Required<Settings> {
    const validated = {
        maxMentionItems: Math.min(
            Math.max(
                settings.maxMentionItems || DEFAULT_SETTINGS.maxMentionItems,
                SETTINGS_LIMITS.maxMentionItems.min,
            ),
            SETTINGS_LIMITS.maxMentionItems.max,
        ),
        maxTokens: Math.min(
            Math.max(settings.maxTokens || DEFAULT_SETTINGS.maxTokens, SETTINGS_LIMITS.maxTokens.min),
            SETTINGS_LIMITS.maxTokens.max,
        ),
        debounceDelay: Math.min(
            Math.max(
                settings.debounceDelay || DEFAULT_SETTINGS.debounceDelay,
                SETTINGS_LIMITS.debounceDelay.min,
            ),
            SETTINGS_LIMITS.debounceDelay.max,
        ),
        enableNavigation:
            settings.enableNavigation === undefined
                ? DEFAULT_SETTINGS.enableNavigation
                : !!settings.enableNavigation,
    }

    return validated
}

const deepwikiProvider: Provider = {
    meta(params: MetaParams): MetaResult {
        return {
            name: 'deepwiki',
            mentions: {
                label: 'type <user/repo or githubUrl> [page search query or page number]',
            },
        }
    },

    async mentions(params: MentionsParams, settings: Partial<Settings> = {}): Promise<MentionsResult> {
        // Validate input
        if (!params.query || params.query.trim().length === 0) {
            return []
        }

        // Validate and normalize settings
        const validatedSettings = validateSettings(settings)

        try {
            // Parse input query
            const { repoName, searchQuery, pageNumbers } = parseInputQuery(params.query || '')

            // Fetch HTML
            const fetchFn = debounce(fetchDeepwikiHTML, validatedSettings.debounceDelay, '')
            const html = await fetchFn(repoName)

            // Parse markdown pages
            const pages = parseHTMLToMarkdown(html)

            // Check if any pages were found
            if (pages.length === 0) {
                return createErrorItem(
                    'Repository not found',
                    'The specified repository wiki pages do not exist or are not supported by deepwiki.com.',
                )
            }

            // Handle page numbers specification
            if (pageNumbers) {
                const filteredPages = filterPagesByPageNumbers(pages, pageNumbers)

                // Return individual page items for specified page numbers
                return filteredPages.map(page => {
                    const limitedContent = applySizeLimit(page.content, validatedSettings)

                    return {
                        title: `${page.h1Title} [${page.size.toLocaleString()}]`,
                        uri: `https://deepwiki.com/${repoName}#${page.h1Title}`,
                        description: `${page.summary} (${page.size.toLocaleString()} tokens)`,
                        data: {
                            content: limitedContent,
                            isNavigation: false,
                        },
                    }
                })
            }

            // Generate Navigation vs normal results
            if (!searchQuery && validatedSettings.enableNavigation) {
                // Return Navigation item for AI to choose from
                const navigationContent = generateNavigation(
                    pages,
                    repoName,
                    validatedSettings.maxMentionItems,
                )

                return [
                    {
                        title: `${repoName} Wiki Navigation`,
                        uri: `https://deepwiki.com/${repoName}#naviigation`,
                        description: `${pages.length} wiki pages available`,
                        data: {
                            content: navigationContent,
                            isNavigation: true,
                        },
                    },
                ]
            }

            // Filter pages by search query
            const filteredPages = filterPagesByQuery(pages, searchQuery)

            // Limit results
            const limitedPages = filteredPages.slice(0, validatedSettings.maxMentionItems)

            // Return individual page items
            return limitedPages.map(page => {
                const limitedContent = applySizeLimit(page.content, validatedSettings)

                return {
                    title: `${page.h1Title} [${page.size.toLocaleString()}]`,
                    uri: `https://deepwiki.com/${repoName}#${page.h1Title}`,
                    description: `${page.summary} (${page.size.toLocaleString()} tokens)`,
                    data: {
                        content: limitedContent,
                        isNavigation: false,
                    },
                }
            })
        } catch (error) {
            if (error instanceof Error) {
                return createErrorItem(error.message, error.message)
            }
            return createErrorItem('Unknown Err', 'An unexpected error occurred')
        }
    },

    async items(params: ItemsParams, settings: Partial<Settings> = {}): Promise<ItemsResult> {
        // Check if mention data exists
        const mentionData = params.mention?.data as DeepwikiMentionData | undefined
        if (!mentionData?.content) {
            return []
        }

        // Handle error items
        if (mentionData.isError) {
            return [
                {
                    title: params.mention?.title || 'Error',
                    ui: { hover: { text: 'Error occurred while processing request' } },
                    ai: { content: mentionData.content },
                },
            ]
        }

        // Handle navigation items
        if (mentionData.isNavigation) {
            return [
                {
                    title: params.mention?.title || 'Wiki Navigation',
                    url: params.mention?.uri,
                    ui: { hover: { text: 'AI-assisted wiki page selection' } },
                    ai: { content: mentionData.content },
                },
            ]
        }

        return [
            {
                title: params.mention?.title || 'Wiki Page',
                url: params.mention?.uri,
                ui: { hover: { text: `Wiki page from ${params.mention?.uri}` } },
                ai: { content: mentionData.content },
            },
        ]
    },
}

export default deepwikiProvider
