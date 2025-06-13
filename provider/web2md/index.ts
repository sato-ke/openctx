import type { Provider, ItemsParams, ItemsResult, MetaParams, MetaResult, MentionsParams, MentionsResult, Mention } from '@openctx/provider'
import { fetchWebPage } from './api.js'
import { isValidUrl, extractContent, convertToMarkdown } from './core.js'
import { DEFAULT_SETTINGS, type Settings } from './types.js'
import { debounce } from './utils/debounce.js'

// Create debounced fetch function
const debouncedFetch = debounce(fetchWebPage, 300)

/**
 * OpenCtx provider for converting web articles to Markdown
 */
const web2mdProvider: Provider = {
    meta(_params: MetaParams): MetaResult {
        return {
            name: 'Web2Md',
            mentions: {
                label: 'Convert web article to Markdown',
            },
        }
    },

    async mentions(params: MentionsParams, settingsInput?: Partial<Settings>): Promise<MentionsResult> {
        const settings: Settings = { ...DEFAULT_SETTINGS, ...settingsInput }
        const query = params.query?.trim()

        if (!query) {
            return []
        }

        // Check if query is a valid URL
        if (!isValidUrl(query)) {
            return []
        }

        try {
            // Fetch web page with debounce
            const fetchResult = await debouncedFetch(query, settings)

            // Extract content
            const extractedContent = extractContent(fetchResult.html, query)

            // Convert to Markdown
            const markdown = convertToMarkdown(extractedContent, settings.maxTokens, query)

            // Create mention
            const mention: Mention = {
                title: extractedContent.title,
                uri: query,
                description: `Web article converted to Markdown (${Math.round(markdown.length / 1000)}KB)`,
                data: {
                    markdown,
                },
            }


            return [mention]
        } catch (error) {

            // Return error as mention
            return [{
                title: 'Error',
                uri: query,
                description: error instanceof Error ? error.message : 'Unknown error',
            }]
        }
    },

    async items(params: ItemsParams, _settingsInput?: Partial<Settings>): Promise<ItemsResult> {
        const mention = params.mention

        if (!mention?.data?.markdown) {
            return []
        }

        // Use data from mention
        return [{
            title: mention.title,
            ai: {
                content: (mention.data as { markdown: string }).markdown,
            },
            url: mention.uri,
        }]
    },
}

export default web2mdProvider
