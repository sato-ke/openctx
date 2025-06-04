/**
 * Core functions for deepwiki.com OpenCtx Provider
 * All implemented as pure functions (no side effects, testable)
 */

import fuzzysort from 'fuzzysort'
import { encode } from 'gpt-tokenizer/encoding/cl100k_base'
import type { MarkdownPage, ParsedInput, ChatHistoryData, ChatResponseItem, Settings } from './types.js'
import { PATTERNS } from './types.js'

/**
 * Parse user input into repository name, search query, or chat URL
 * Supports "user/repo" format, GitHub URLs, and DeepWiki chat URLs
 * @param query - Input in the form "user/repo [search query]", GitHub URL, or DeepWiki chat URL
 * @returns Parsed result
 * @throws Error - If the input format is invalid
 */
export function parseInputQuery(query: string): ParsedInput {
    const trimmed = query.trim()

    // Check for empty string
    if (!trimmed) {
        throw new Error('Repository name is required')
    }

    // Split by space
    const parts = trimmed.split(/\s+/)
    const firstPart = parts[0]
    const remainingParts = parts.slice(1).join(' ')

    let repoName: string

    // Check if it's a URL
    if (firstPart.startsWith('http')) {
        // Check if it looks like a chat URL (contains /search/)
        if (firstPart.includes('/search/')) {
            // If it contains /search/, it should be a DeepWiki chat URL
            const sessionId = extractSessionIdFromURL(firstPart)
            return { type: 'chat', sessionId }
        }
        // Check if it's any other DeepWiki URL
        if (firstPart.includes('deepwiki.com')) {
            // It's a DeepWiki URL but not a chat URL
            throw new Error('DeepWiki URL must contain /search/{sessionId}')
        }
        // Otherwise treat as GitHub URL
        repoName = extractRepoFromGitHubURL(firstPart)
    } else {
        repoName = firstPart
    }

    // Check repository name format
    if (!repoName.includes('/') || repoName.split('/').length !== 2) {
        throw new Error('Repository name must be in "user/repo" format')
    }

    // Check for empty user/repo part
    const [user, repo] = repoName.split('/')
    if (!user.trim() || !repo.trim()) {
        throw new Error('User name and repository name cannot be empty')
    }

    // Parse search query or page numbers
    let searchQuery: string | undefined = undefined
    let pageNumbers: number[] | undefined = undefined

    if (remainingParts) {
        // Check if it's a page numbers pattern
        if (PATTERNS.PAGE_NUMBERS.test(remainingParts)) {
            const numbers = remainingParts.split('/').map(num => Number.parseInt(num, 10))
            // Validate all numbers are positive integers
            if (numbers.every(num => Number.isInteger(num) && num > 0)) {
                pageNumbers = numbers
            } else {
                searchQuery = remainingParts
            }
        } else {
            searchQuery = remainingParts
        }
    }

    return { repoName, searchQuery, pageNumbers }
}

/**
 * Extract session ID from DeepWiki chat URL
 * @param url - DeepWiki chat URL like "https://deepwiki.com/search/{sessionId}"
 * @returns Session ID
 * @throws Error - If URL format is invalid
 */
function extractSessionIdFromURL(url: string): string {
    try {
        const urlObj = new URL(url)

        // Check if it's a DeepWiki URL
        if (urlObj.hostname !== 'deepwiki.com') {
            throw new Error('URL must be from https://deepwiki.com')
        }

        // Extract session ID from path /search/{sessionId}
        const pathParts = urlObj.pathname.split('/')
        const searchIndex = pathParts.findIndex(part => part === 'search')

        if (searchIndex === -1 || searchIndex + 1 >= pathParts.length) {
            throw new Error('DeepWiki URL must contain /search/{sessionId}')
        }

        const sessionId = pathParts[searchIndex + 1]

        if (!sessionId || sessionId.trim() === '') {
            throw new Error('Session ID cannot be empty')
        }

        return sessionId
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Invalid DeepWiki chat URL format')
    }
}

/**
 * Extract repository name from GitHub URL
 * @param url - GitHub URL like "https://github.com/user/repo" or "https://github.com/user/repo/path"
 * @returns Repository name in "user/repo" format
 * @throws Error - If URL format is invalid
 */
function extractRepoFromGitHubURL(url: string): string {
    try {
        const urlObj = new URL(url)

        // Check if it's a GitHub URL
        if (urlObj.hostname !== 'github.com') {
            throw new Error('URL must be from https://github.com')
        }

        // Extract path and remove leading slash
        const pathParts = urlObj.pathname.slice(1).split('/')

        // Need at least user and repo
        if (pathParts.length < 2) {
            throw new Error('GitHub URL must contain user and repository name')
        }

        const user = pathParts[0]
        const repo = pathParts[1]

        // Check for empty parts
        if (!user || !repo) {
            throw new Error('User name and repository name cannot be empty')
        }

        return `${user}/${repo}`
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Invalid GitHub URL format')
    }
}

/**
 * Generate deepwiki.com URL from repository name
 * @param repoName - Repository name in the form "user/repo"
 * @returns deepwiki.com URL
 */
export function buildDeepwikiURL(repoName: string): string {
    // Important: Do not add github.com prefix
    return `https://deepwiki.com/${repoName}`
}

/**
 * Extract markdown pages from deepwiki.com HTML
 * @param html - HTML obtained from deepwiki.com
 * @returns Array of extracted markdown pages
 */
export function parseHTMLToMarkdown(html: string): MarkdownPage[] {
    if (!html) {
        return []
    }

    const pages: MarkdownPage[] = []

    try {
        // Extract Next.js RSC chunks
        const chunks = extractNextFChunks(html)

        for (const chunk of chunks) {
            if (isMarkdownContent(chunk)) {
                try {
                    const page = parseMarkdownPage(chunk)
                    pages.push(page)
                } catch (parseError) {
                    // Ignore errors for individual pages (continue processing others)
                    console.warn('Page parse error:', parseError)
                }
            }
        }
    } catch (error) {
        console.error('HTML parse error:', error)
        // Return empty array (handle error at higher level)
    }

    return pages
}

/**
 * Extract Next.js RSC chunks
 * @param html - HTML string
 * @returns Array of extracted chunks
 */
function extractNextFChunks(html: string): string[] {
    const PATTERN = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g
    const chunks: string[] = []
    let match: RegExpExecArray | null

    match = PATTERN.exec(html)
    while (match !== null) {
        try {
            // Unescape JSON
            const unescaped = JSON.parse(`"${match[1]}"`)
            chunks.push(unescaped)
        } catch {
            // Ignore JSON parse errors
        }
        match = PATTERN.exec(html)
    }

    return chunks
}

/**
 * Determine if content is markdown
 * @param content - Content to check
 * @returns true if markdown content
 */
function isMarkdownContent(content: string): boolean {
    const trimmed = content.trim()
    return trimmed.startsWith('#') && trimmed.length > 100
}

/**
 * Parse markdown content and generate page info
 * @param content - Markdown content
 * @returns Page info
 * @throws Error - If h1 heading is not found
 */
function parseMarkdownPage(content: string): MarkdownPage {
    // Extract h1 heading (required)
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (!h1Match) {
        throw new Error('h1 heading not found')
    }

    const cleanedContent = clearMarkdownContent(content)

    // Extract h2 headings
    const h2Matches = cleanedContent.match(/^##\s+(.+)$/gm) || []
    const h2Headings = h2Matches.map(match => match.replace(/^##\s+/, '').trim())

    // Generate summary
    const summary = generateSummary(cleanedContent)

    return {
        h1Title: h1Match[1].trim(),
        h2Headings,
        summary,
        content: cleanedContent,
        size: estimateTokenCount(cleanedContent),
    }
}

/**
 * Remove common patterns and irrelevant sections from markdown content
 * @param content - Markdown content to clean
 * @returns Cleaned markdown content
 */
function clearMarkdownContent(content: string): string {
    return (
        content
            // remove Relevant source links
            .replace(/<details>\s*<summary>.*?<\/summary>(\s|.)*?<\/details>\s*/g, '')
        // .replace(/Source: /g, '')
        // .replace(/\[\S+:\d+-\d+\]\(\)/g, '')
    )
}

/**
 * Generate summary from markdown content
 * @param content - Markdown content
 * @returns Generated summary
 */
function generateSummary(content: string): string {
    const lines = content.split('\n')
    let inFirstSection = false
    let paragraph = ''

    for (const line of lines) {
        const trimmed = line.trim()

        // Start after h1 heading
        if (trimmed.match(/^#\s+/)) {
            inFirstSection = true
            continue
        }

        if (!inFirstSection) continue

        // End at next heading (h2 or later)
        if (trimmed.match(/^#{2,}\s+/)) break

        // Lines to skip
        if (!trimmed) {
            continue
        }

        paragraph += (paragraph ? ' ' : '') + trimmed
    }

    // Remove common patterns
    const summary = paragraph
        .replace(/^The following files were used as context.*?:/i, '')
        .replace(/&\w+;/g, ' ') // Remove HTML entities
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()

    // character limit (cut at word boundary)
    // const maxSummaryLength = 400
    // if (summary.length > maxSummaryLength) {
    //     const cutIndex = summary.lastIndexOf(' ', maxSummaryLength)
    //     summary = summary.substring(0, cutIndex > 0 ? cutIndex : maxSummaryLength) + '...'
    // }

    return summary || 'Summary for this page is not available.'
}

/**
 * Filter markdown pages by search query
 * @param pages - Array of pages to search
 * @param query - Search query (if undefined, return all)
 * @returns Filtered array of pages
 */
export function filterPagesByQuery(pages: MarkdownPage[], query?: string): MarkdownPage[] {
    if (!query) return pages

    const pagesH2Joined = pages.map(page => ({
        ...page,
        h2Headings: page.h2Headings.join(', '),
    }))
    // Weighted search using fuzzysort
    const results = fuzzysort.go(query, pagesH2Joined, {
        keys: ['h1Title', 'summary', 'h2Headings'],
        limit: 20, // Internal limit (larger than settings limit)
        threshold: -10000, // Lenient threshold (almost all pass)
    })
    const resultsH2Separated = results.map(result => {
        const page = result.obj
        const h2Headings = page.h2Headings.split(', ')
        return {
            ...page,
            h2Headings: h2Headings,
        }
    })

    return resultsH2Separated
}

/**
 * Filter markdown pages by page numbers
 * @param pages - Array of pages to filter
 * @param pageNumbers - Array of page numbers (1-based)
 * @returns Filtered array of pages in the order of specified page numbers
 */
export function filterPagesByPageNumbers(pages: MarkdownPage[], pageNumbers: number[]): MarkdownPage[] {
    const result: MarkdownPage[] = []

    for (const pageNum of pageNumbers) {
        // Convert to 0-based index and check bounds
        const index = pageNum - 1
        if (index >= 0 && index < pages.length) {
            result.push(pages[index])
        }
    }

    return result
}

/**
 * Generate navigation info for AI
 * @param pages - Array of target pages
 * @param repoName - Repository name
 * @param maxMentionItems - Maximum number of pages that can be selected
 * @returns Markdown text for navigation
 */
export function generateNavigation(
    pages: MarkdownPage[],
    repoName: string,
    maxMentionItems: number,
): string {
    if (pages.length === 0) {
        return `No wiki pages found for ${repoName}.`
    }

    const pageList = pages
        .map((page, index) => {
            // Show up to 5 main sections (h2 headings)
            const mainSections =
                page.h2Headings.length > 0
                    ? page.h2Headings.slice(0, 5).join(', ') + (page.h2Headings.length > 5 ? '...' : '')
                    : 'None'

            return `### ${index + 1}. ${page.h1Title}
- **Summary**: ${page.summary}
- **Main sections**: ${mainSections}
- **Size**: ${page.size.toLocaleString()} characters`
        })
        .join('\n\n')

    return `This is the wiki for ${repoName}.

## How to Access Specific Pages
- Multiple pages: @deepwiki ${repoName} 1/3/5 (maximum ${maxMentionItems} pages per request)
- Single page: @deepwiki ${repoName} 17
- Search pages: @deepwiki ${repoName} search_term

## Selection Method
Based on the user's question, choose up to ${maxMentionItems} most relevant page titles from the list below.

## Available Wiki Pages

${pageList}`
}

/**
 * Limit content size based on settings
 * @param content - Content to limit
 * @param settings - Size limit settings
 * @returns Content after applying size limit
 */
export function applySizeLimit(content: string, settings: Settings): string {
    const maxTokens = settings.maxTokens || 12000
    const estimatedTokens = estimateTokenCount(content)
    if (estimatedTokens > maxTokens) {
        const targetLength = Math.floor(maxTokens * 3.5)
        const truncated = truncatePreservingStructure(content, targetLength)
        const estimatedTokens = estimateTokenCount(truncated)

        if (estimatedTokens > maxTokens) {
            const targetLength = Math.floor(maxTokens * 3)
            return truncatePreservingStructure(truncated, targetLength)
        }
        return truncated
    }
    return content // If within token limit, do not check char limit
}

/**
 * Estimate token count
 * @param text - Target text
 * @returns Estimated token count
 */
function estimateTokenCount(text: string): number {
    const tokenLength = encode(text).length
    return tokenLength

    // Simple language detection
    // const ratio = 3.5
    // return Math.ceil(text.length / ratio)
}

/**
 * Truncate content while preserving heading structure
 * @param content - Target content
 * @param maxLength - Max number of characters
 * @returns Truncated content
 */
function truncatePreservingStructure(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content

    const lines = content.split('\n')
    let result = ''
    let currentLength = 0
    let lastHeadingLevel = 0

    for (const line of lines) {
        const lineLength = line.length + 1 // +1 for newline

        // If exceeding limit
        if (currentLength + lineLength > maxLength) {
            // If heading line (h1-h3), include for structure
            const headingMatch = line.trim().match(/^(#{1,3})\s+/)
            if (headingMatch) {
                const level = headingMatch[1].length
                // Exclude deeper heading levels (to keep structure consistent)
                if (level <= lastHeadingLevel + 1) {
                    result += line + '\n'
                    currentLength += lineLength
                    lastHeadingLevel = level
                }
            }
            break
        }

        // Track heading level
        const headingMatch = line.trim().match(/^(#{1,3})\s+/)
        if (headingMatch) {
            lastHeadingLevel = headingMatch[1].length
        }

        result += line + '\n'
        currentLength += lineLength
    }

    return result.trim() + '(content was truncated)'
}

/**
 * Clean title by removing <relevant_context> tags and their content
 * @param title - Original title with possible context tags
 * @returns Cleaned title
 */
export function cleanTitle(title: string): string {
    // Remove <relevant_context>...</relevant_context> tags and their content
    return title.replace(/<relevant_context>.*?<\/relevant_context>/g, '').trim()
}

/**
 * Format chat history data for OpenCtx
 * @param chatData - Chat history data from API
 * @param settings - Settings for token limits
 * @returns Formatted markdown content
 */
export function formatChatHistory(chatData: ChatHistoryData, settings: Settings): string {
    if (!chatData.queries || chatData.queries.length === 0) {
        return 'No chat history available.'
    }

    // Clean up the title by removing <relevant_context> tags
    const cleanedTitle = cleanTitle(chatData.title)
    let result = `# ${cleanedTitle}\n\n`

    for (let i = 0; i < chatData.queries.length; i++) {
        const query = chatData.queries[i]

        let queryContent = `## Query ${i + 1}\n\n`
        queryContent += `**User Question:** ${cleanTitle(query.user_query)}\n\n`

        // Extract and combine chunk responses
        const chunks = extractChunksFromResponse(query.response)
        if (chunks.length > 0) {
            queryContent += `**AI Response:**\n${chunks.join('')}\n\n`
        }

        // Skip Code References to reduce token usage

        queryContent += '---\n\n'

        // Apply size limit to each query individually
        result += queryContent
    }
    result = applySizeLimit(result, settings)

    return result.trim()
}

/**
 * Extract chunk data from chat response
 * @param response - Array of response items
 * @returns Array of chunk strings
 */
function extractChunksFromResponse(response: ChatResponseItem[]): string[] {
    return response
        .filter((item): item is { type: 'chunk'; data: string } => item.type === 'chunk')
        .map(item => item.data)
}

