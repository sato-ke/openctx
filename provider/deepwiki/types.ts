/**
 * Type definitions for deepwiki.com OpenCtx Provider
 */

import type {
    ItemsResult as BaseItemsResult,
    MentionsResult as BaseMentionsResult,
} from '@openctx/provider'

/**
 * Structure of a markdown page
 */
export interface MarkdownPage {
    /** Text of the h1 heading */
    h1Title: string
    /** Array of h2 headings */
    h2Headings: string[]
    /** Summary of the page (generated from the paragraph immediately after h1) */
    summary: string
    /** Complete markdown content */
    content: string
    /** Size of the content (number of characters) */
    size: number
}

/**
 * Provider settings (user-configurable)
 */
export interface Settings {
    /** Maximum number of items returned by mentions() (default: 20, range: 1-20) */
    maxMentionItems?: number
    /** Maximum number of tokens per markdown content (default: null, range: 100-15000) */
    maxTokens?: number
    /** Debounce delay in ms for mentions() calls (default: 300, range: 100-1000) */
    debounceDelay?: number
    /** Whether to enable generation of Navigation information (default: true) */
    enableNavigation?: boolean
}

/**
 * Parsed input result
 */
export interface ParsedQuery {
    /** Repository name in "user/repo" format */
    repoName: string
    /** Search query (optional) */
    searchQuery?: string
    /** Page numbers to retrieve (1-based, optional) */
    pageNumbers?: number[]
}

/**
 * Parsed chat URL result
 */
export interface ParsedChatQuery {
    /** Type identifier for chat queries */
    type: 'chat'
    /** Session ID from the chat URL */
    sessionId: string
}

/**
 * Combined parsed query result
 */
export type ParsedInput = ParsedQuery | ParsedChatQuery

/**
 * Chat history response item types
 */
export interface ChatResponseChunk {
    type: 'chunk'
    data: string
}

export interface ChatResponseReference {
    type: 'reference'
    data: {
        file_path: string
        range_start: number
        range_end: number
    }
}

export interface ChatResponseFileContents {
    type: 'file_contents'
    data: {
        file_path: string
        contents: string
    }
}

export interface ChatResponseLoadingIndexes {
    type: 'loading_indexes'
    data: unknown
}

export interface ChatResponseStats {
    type: 'stats'
    data: unknown
}

export interface ChatResponseDone {
    type: 'done'
}

export type ChatResponseItem = 
    | ChatResponseChunk 
    | ChatResponseReference 
    | ChatResponseFileContents
    | ChatResponseLoadingIndexes
    | ChatResponseStats
    | ChatResponseDone

/**
 * Chat query structure from the API
 */
export interface ChatQuery {
    user_query: string
    use_knowledge: boolean
    engine_id: string
    repo_context_ids: string[]
    response: ChatResponseItem[]
}

/**
 * Chat history data structure from the API
 */
export interface ChatHistoryData {
    title: string
    queries: ChatQuery[]
}

/**
 * Data structure returned by mentions()
 */
export interface DeepwikiMentionData {
    /** Complete markdown content */
    content: string
    /** Whether this is a Navigation item */
    isNavigation?: boolean
    /** Whether this is an error item */
    isError?: boolean
}

/**
 * Result type of mentions()
 */
export type MentionsResult = BaseMentionsResult

/**
 * Result type of items()
 */
export type ItemsResult = BaseItemsResult

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Required<Settings> = {
    maxMentionItems: 5,
    maxTokens: 3000,
    debounceDelay: 300,
    enableNavigation: true,
} as const

/**
 * Range of setting values
 */
export const SETTINGS_LIMITS = {
    maxMentionItems: { min: 1, max: 20 },
    maxTokens: { min: 1000, max: 20000 },
    debounceDelay: { min: 100, max: 1000 },
} as const

/**
 * Regular expression patterns
 */
export const PATTERNS = {
    /** Pattern to extract Next.js RSC chunk */
    NEXT_F_PUSH: /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g,
    /** Pattern for h1 heading */
    H1_HEADING: /^#\s+(.+)$/m,
    /** Pattern for h2 heading */
    H2_HEADING: /^##\s+(.+)$/gm,
    /** Pattern for repository name */
    REPO_NAME: /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/,
    /** Pattern for page numbers (e.g., "1/4/9/12" or "5") */
    PAGE_NUMBERS: /^\d+(?:\/\d+)*$/,
} as const

/**
 * Timeout settings
 */
export const TIMEOUTS = {
    /** Timeout for fetching HTML (milliseconds) */
    FETCH_HTML: 3000,
} as const
