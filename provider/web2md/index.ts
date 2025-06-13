import type { Provider, ItemsParams, ItemsResult, MetaParams, MetaResult, MentionsParams, MentionsResult, Mention } from '@openctx/provider'
import { fetchWebPage } from './api.js'
import { isValidUrl, extractContent, convertToMarkdown, saveMarkdownLocally } from './core.js'
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

            // Try to save locally if enabled
            const savedPath = await saveMarkdownLocally(
                markdown,
                query,
                extractedContent.title,
                settings
            )

            // Create mention with saved path info
            const mention: Mention = {
                title: extractedContent.title,
                uri: query,
                description: savedPath 
                    ? `Saved to ${savedPath} and mentioned to Cody`
                    : `Web article converted to Markdown (${Math.round(markdown.length / 1000)}KB)`,
                data: {
                    markdown,
                    savedPath,
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

        const { markdown, savedPath } = mention.data as { markdown: string; savedPath?: string }

        // Return different content based on whether file was saved
        if (savedPath) {
            return [{
                title: mention.title,
                ai: {
                    content: `Converted ${mention.uri} to Markdown and saved to ${savedPath}`,
                },
                url: mention.uri,
            }]
        } else {
            // Use data from mention
            return [{
                title: mention.title,
                ai: {
                    content: markdown,
                },
                url: mention.uri,
            }]
        }
    },
}

export default web2mdProvider
