import type {
    ItemsParams,
    ItemsResult,
    MentionsParams,
    MentionsResult,
    MetaParams,
    MetaResult,
    Provider,
} from '@openctx/provider'
import fuzzysort from 'fuzzysort'
import { fetchLibraryDocumentation, searchLibraries } from './api.js'

type Settings = {
    tokens: number
    mentionLimit?: number
}

const checkSettings = (settings: Settings) => {
    const missingKeys = ['tokens'].filter(key => !(key in settings))
    if (missingKeys.length > 0) {
        throw new Error(`Missing settings: ${JSON.stringify(missingKeys)}`)
    }
}

const CONTEXT7_BASE_URL = 'https://context7.com'

const DEFAULT_MENTION_LIMIT = 3
const MAX_MENTION_LIMIT = 20

const Context7Provider: Provider = {
    meta(params: MetaParams, settings: Settings): MetaResult {
        return {
            name: 'Context7',
            mentions: { label: 'type `<search library query> [topic keyword]`' },
        }
    },

    async mentions(params: MentionsParams, settings: Settings): Promise<MentionsResult> {
        checkSettings(settings)

        if (params.query === undefined || params.query.length === 0) {
            return []
        }
        const [repositoryQuery, ...rest] = params.query.trim().toLocaleLowerCase().split(/\s+/)
        const topicKeyword = rest.join(' ') || undefined

        const response = await searchLibraries(repositoryQuery)

        if (!response || response.results.length === 0) {
            return []
        }

        const mentionLimit =
            typeof settings.mentionLimit === 'number'
                ? Math.min(Math.max(settings.mentionLimit, 1), MAX_MENTION_LIMIT)
                : DEFAULT_MENTION_LIMIT

        let libraries = fuzzysort
            .go(repositoryQuery, response.results, {
                keys: ['title', 'id', 'description'],
                limit: mentionLimit,
            })
            .map(result => result.obj)

        if (libraries.length === 0) {
            libraries = response.results
                .sort((a, b) => b.trustScore - a.trustScore)
                .slice(0, mentionLimit)
        }

        return libraries.map(result => ({
            title: result.title,
            uri: `${CONTEXT7_BASE_URL}/${result.id}`,
            description: `${result.description} [${result.totalTokens}]`,
            data: {
                id: result.id,
                topic: topicKeyword,
            },
        }))
    },

    async items(params: ItemsParams, settings: Settings): Promise<ItemsResult> {
        checkSettings(settings)

        if (params.mention?.data?.id === undefined) {
            return []
        }

        const { id, topic } = params.mention.data as { id: string; topic: string }
        const response = await fetchLibraryDocumentation(id, settings.tokens, {
            topic: topic,
        })

        if (!response) {
            return []
        }

        return [
            {
                title: `context7 docs for repository: ${id} / topic: ${topic}`,
                url: `${CONTEXT7_BASE_URL}/${id}/llms.txt?topic=${topic}&tokens=${settings.tokens}`,
                ui: { hover: { text: `${id}#${topic}` } },
                ai: { content: response },
            },
        ]
    },
}

export default Context7Provider
