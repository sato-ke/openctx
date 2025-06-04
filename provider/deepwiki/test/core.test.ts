/**
 * Unit tests for core functions
 */

import { describe, expect, test } from 'vitest'
import {
    applySizeLimit,
    buildDeepwikiURL,
    filterPagesByQuery,
    generateNavigation,
    parseHTMLToMarkdown,
    parseInputQuery,
    formatChatHistory,
    cleanTitle,
} from '../core.js'
import type { MarkdownPage, Settings, ChatHistoryData } from '../types.js'

describe('parseInputQuery', () => {
    test('parses valid repository name', () => {
        const result = parseInputQuery('facebook/react')
        expect(result).toEqual({
            repoName: 'facebook/react',
            searchQuery: undefined,
        })
    })

    test('parses repository name with search query', () => {
        const result = parseInputQuery('facebook/react hooks')
        expect(result).toEqual({
            repoName: 'facebook/react',
            searchQuery: 'hooks',
        })
    })

    test('parses GitHub URL without path', () => {
        const result = parseInputQuery('https://github.com/facebook/react')
        expect(result).toEqual({
            repoName: 'facebook/react',
            searchQuery: undefined,
        })
    })

    test('parses GitHub URL with path', () => {
        const result = parseInputQuery('https://github.com/microsoft/vscode/blob/main/README.md')
        expect(result).toEqual({
            repoName: 'microsoft/vscode',
            searchQuery: undefined,
        })
    })

    test('parses GitHub URL with search query', () => {
        const result = parseInputQuery('https://github.com/facebook/react/tree/main/packages hooks api')
        expect(result).toEqual({
            repoName: 'facebook/react',
            searchQuery: 'hooks api',
        })
    })

    test('parses GitHub URL with complex path', () => {
        const result = parseInputQuery(
            'https://github.com/vercel/next.js/blob/canary/docs/api-reference/next.config.js/introduction.md',
        )
        expect(result).toEqual({
            repoName: 'vercel/next.js',
            searchQuery: undefined,
        })
    })

    test('handles GitHub URL with query parameters', () => {
        const result = parseInputQuery('https://github.com/facebook/react/issues?q=is%3Aopen+is%3Aissue')
        expect(result).toEqual({
            repoName: 'facebook/react',
            searchQuery: undefined,
        })
    })

    test('parses repository name with multi-word search query', () => {
        const result = parseInputQuery('microsoft/vscode api reference')
        expect(result).toEqual({
            repoName: 'microsoft/vscode',
            searchQuery: 'api reference',
        })
    })

    test('handles extra whitespace', () => {
        const result = parseInputQuery('  facebook/react   hooks api  ')
        expect(result).toEqual({
            repoName: 'facebook/react',
            searchQuery: 'hooks api',
        })
    })

    test('throws error for empty input', () => {
        expect(() => parseInputQuery('')).toThrow('Repository name is required')
        expect(() => parseInputQuery('   ')).toThrow('Repository name is required')
    })

    test('throws error for invalid repository format', () => {
        expect(() => parseInputQuery('invalid')).toThrow('Repository name must be in "user/repo" format')
        expect(() => parseInputQuery('invalid/repo/extra')).toThrow(
            'Repository name must be in "user/repo" format',
        )
    })

    test('throws error for empty user or repo name', () => {
        expect(() => parseInputQuery('/repo')).toThrow('User name and repository name cannot be empty')
        expect(() => parseInputQuery('user/')).toThrow('User name and repository name cannot be empty')
        expect(() => parseInputQuery('/ ')).toThrow('User name and repository name cannot be empty')
    })

    test('throws error for non-GitHub URLs', () => {
        expect(() => parseInputQuery('https://gitlab.com/user/repo')).toThrow(
            'URL must be from https://github.com',
        )
        expect(() => parseInputQuery('https://bitbucket.org/user/repo')).toThrow(
            'URL must be from https://github.com',
        )
    })

    test('throws error for invalid GitHub URLs', () => {
        expect(() => parseInputQuery('https://github.com/')).toThrow(
            'GitHub URL must contain user and repository name',
        )
        expect(() => parseInputQuery('https://github.com/user')).toThrow(
            'GitHub URL must contain user and repository name',
        )
        expect(() => parseInputQuery('https://github.com/user/')).toThrow(
            'User name and repository name cannot be empty',
        )
    })

    test('throws error for malformed URLs', () => {
        expect(() => parseInputQuery('not-a-url')).toThrow(
            'Repository name must be in "user/repo" format',
        )
        expect(() => parseInputQuery('https://invalid-url')).toThrow(
            'URL must be from https://github.com',
        )
    })

    describe('chat URLs', () => {
        test('parses valid DeepWiki chat URL', () => {
            const result = parseInputQuery('https://deepwiki.com/search/abc123-def456')
            expect(result).toEqual({
                type: 'chat',
                sessionId: 'abc123-def456',
            })
        })

        test('parses DeepWiki chat URL with UUID session ID', () => {
            const result = parseInputQuery('https://deepwiki.com/search/_57f549cc-8544-4567-b91f-e8c94fa59388')
            expect(result).toEqual({
                type: 'chat',
                sessionId: '_57f549cc-8544-4567-b91f-e8c94fa59388',
            })
        })

        test('parses DeepWiki chat URL with query parameters', () => {
            const result = parseInputQuery('https://deepwiki.com/search/session123?foo=bar')
            expect(result).toEqual({
                type: 'chat',
                sessionId: 'session123',
            })
        })

        test('parses DeepWiki chat URL with trailing slash', () => {
            const result = parseInputQuery('https://deepwiki.com/search/session123/')
            expect(result).toEqual({
                type: 'chat',
                sessionId: 'session123',
            })
        })

        test('throws error for non-DeepWiki URLs with search path', () => {
            expect(() => parseInputQuery('https://example.com/search/session123')).toThrow(
                'URL must be from https://deepwiki.com',
            )
        })

        test('throws error for DeepWiki URL without search path', () => {
            expect(() => parseInputQuery('https://deepwiki.com/other/path')).toThrow(
                'DeepWiki URL must contain /search/{sessionId}',
            )
        })

        test('throws error for DeepWiki URL without session ID', () => {
            expect(() => parseInputQuery('https://deepwiki.com/search/')).toThrow(
                'Session ID cannot be empty',
            )
            expect(() => parseInputQuery('https://deepwiki.com/search')).toThrow(
                'DeepWiki URL must contain /search/{sessionId}',
            )
        })

        test('throws error for empty session ID', () => {
            expect(() => parseInputQuery('https://deepwiki.com/search/ ')).toThrow(
                'Session ID cannot be empty',
            )
        })
    })

    describe('page numbers', () => {
        test('parses repository name with page numbers', () => {
            const result = parseInputQuery('facebook/react 1/4/9/12')
            expect(result).toEqual({
                repoName: 'facebook/react',
                searchQuery: undefined,
                pageNumbers: [1, 4, 9, 12],
            })
        })

        test('handles single page number', () => {
            const result = parseInputQuery('facebook/react 5')
            expect(result).toEqual({
                repoName: 'facebook/react',
                searchQuery: undefined,
                pageNumbers: [5],
            })
        })

        test('handles page numbers with GitHub URL', () => {
            const result = parseInputQuery('https://github.com/facebook/react 2/7')
            expect(result).toEqual({
                repoName: 'facebook/react',
                searchQuery: undefined,
                pageNumbers: [2, 7],
            })
        })

        test('treats invalid page number format as search query', () => {
            const result = parseInputQuery('facebook/react 1/a/3')
            expect(result).toEqual({
                repoName: 'facebook/react',
                searchQuery: '1/a/3',
                pageNumbers: undefined,
            })
        })

        test('treats mixed valid/invalid format as search query', () => {
            const result = parseInputQuery('facebook/react 1/2/hooks')
            expect(result).toEqual({
                repoName: 'facebook/react',
                searchQuery: '1/2/hooks',
                pageNumbers: undefined,
            })
        })

        test('handles zero and negative numbers as search query', () => {
            const result = parseInputQuery('facebook/react 0/-1/2')
            expect(result).toEqual({
                repoName: 'facebook/react',
                searchQuery: '0/-1/2',
                pageNumbers: undefined,
            })
        })
    })

    test('handles special characters in repository name', () => {
        const result = parseInputQuery('user-name/repo.name_test')
        expect(result).toEqual({
            repoName: 'user-name/repo.name_test',
            searchQuery: undefined,
            pageNumbers: undefined,
        })
    })

    test('handles special characters in GitHub URL', () => {
        const result = parseInputQuery('https://github.com/user-name/repo.name_test')
        expect(result).toEqual({
            repoName: 'user-name/repo.name_test',
            searchQuery: undefined,
            pageNumbers: undefined,
        })
    })
})

describe('buildDeepwikiURL', () => {
    test('builds correct URL for basic repository', () => {
        const url = buildDeepwikiURL('facebook/react')
        expect(url).toBe('https://deepwiki.com/facebook/react')
    })

    test('builds correct URL for repository with special characters', () => {
        const url = buildDeepwikiURL('user-name/repo.name_test')
        expect(url).toBe('https://deepwiki.com/user-name/repo.name_test')
    })

    test('does not add github.com prefix', () => {
        const url = buildDeepwikiURL('simple-icons/simple-icons')
        expect(url).toBe('https://deepwiki.com/simple-icons/simple-icons')
        expect(url).not.toContain('github.com')
    })
})

describe('parseHTMLToMarkdown', () => {
    test('extracts multiple markdown pages', () => {
        const html = `
      <html>
        <script>
          self.__next_f.push([1,"# Overview\\n\\nThis is the overview page with sufficient content to be detected as markdown content by our parser."]);
          self.__next_f.push([1,"# API Reference\\n\\n## REST API\\n\\nThis is the API documentation page with detailed information about the REST API endpoints."]);
        </script>
      </html>
    `
        const pages = parseHTMLToMarkdown(html)
        expect(pages).toHaveLength(2)
        expect(pages[0].h1Title).toBe('Overview')
        expect(pages[1].h1Title).toBe('API Reference')
        expect(pages[1].h2Headings).toContain('REST API')
    })

    test('handles escaped characters in content', () => {
        const html = `
            <html>
                <script>
                    self.__next_f.push([1,"# Test \\"Quotes\\"\\n\\nContent with \\"escaped quotes\\" and \\u003cHTML\\u003e tags that should be handled properly for testing purposes with sufficient length."]);
                </script>
            </html>
        `
        const pages = parseHTMLToMarkdown(html)
        expect(pages).toHaveLength(1)
        expect(pages[0].h1Title).toBe('Test "Quotes"')
        expect(pages[0].content).toContain('"escaped quotes"')
        expect(pages[0].content).toContain('<HTML>')
    })

    test('ignores non-markdown content', () => {
        const html = `
      <html>
        <script>
          self.__next_f.push([1,"short content"]);
          self.__next_f.push([1,"19:T3324,"]);
          self.__next_f.push([1,"# Valid Page\\n\\nThis is a valid markdown page with sufficient content to be detected and parsed correctly."]);
        </script>
      </html>
    `
        const pages = parseHTMLToMarkdown(html)
        expect(pages).toHaveLength(1)
        expect(pages[0].h1Title).toBe('Valid Page')
    })

    test('returns empty array for HTML without markdown content', () => {
        const html = `
      <html>
        <script>
          self.__next_f.push([1,"no markdown here"]);
          self.__next_f.push([1,"19:T3324,"]);
        </script>
      </html>
    `
        const pages = parseHTMLToMarkdown(html)
        expect(pages).toHaveLength(0)
    })

    test('handles malformed HTML gracefully', () => {
        const html = `
      <html>
        <script>
          self.__next_f.push([1,"# Broken markdown\\nwith "unescaped quotes"]);
        </script>
      </html>
    `
        const pages = parseHTMLToMarkdown(html)
        // Should not throw error, may return empty array or partial results
        expect(Array.isArray(pages)).toBe(true)
    })

    test('extracts h2 headings correctly', () => {
        const html = `
      <html>
        <script>
          self.__next_f.push([1,"# Main Title\\n\\n## Section 1\\n\\nContent here.\\n\\n## Section 2\\n\\nMore content.\\n\\n### Subsection\\n\\nSubsection content."]);
        </script>
      </html>
    `
        const pages = parseHTMLToMarkdown(html)
        expect(pages).toHaveLength(1)
        expect(pages[0].h2Headings).toEqual(['Section 1', 'Section 2'])
        expect(pages[0].h2Headings).not.toContain('Subsection') // h3 should not be included
    })
})

describe('filterPagesByQuery', () => {
    const mockPages: MarkdownPage[] = [
        {
            h1Title: 'API Reference',
            h2Headings: ['REST API', 'GraphQL API'],
            summary: 'Complete API documentation for developers',
            content: '# API Reference\n\nAPI docs...',
            size: 1500,
        },
        {
            h1Title: 'Getting Started',
            h2Headings: ['Installation', 'Configuration'],
            summary: 'Quick setup guide for new users',
            content: '# Getting Started\n\nSetup guide...',
            size: 1200,
        },
        {
            h1Title: 'Advanced Configuration',
            h2Headings: ['Environment Variables', 'Custom Settings'],
            summary: 'Advanced configuration options and settings',
            content: '# Advanced Configuration\n\nAdvanced guide...',
            size: 2000,
        },
    ]

    test('returns all pages when no query provided', () => {
        const result = filterPagesByQuery(mockPages)
        expect(result).toEqual(mockPages)
    })

    test('returns all pages when empty query provided', () => {
        const result = filterPagesByQuery(mockPages, '')
        expect(result).toEqual(mockPages)
    })

    test('filters by h1 title', () => {
        const result = filterPagesByQuery(mockPages, 'API')
        expect(result.length).toBeGreaterThanOrEqual(1)
        expect(result[0].h1Title).toBe('API Reference')
    })

    test('filters by h2 headings', () => {
        const result = filterPagesByQuery(mockPages, 'Installation')
        expect(result.length).toBeGreaterThan(0)
        expect(result.some(page => page.h1Title === 'Getting Started')).toBe(true)
    })

    test('filters by summary content', () => {
        const result = filterPagesByQuery(mockPages, 'developers')
        expect(result.length).toBeGreaterThan(0)
        expect(result[0].h1Title).toBe('API Reference')
    })

    test('handles fuzzy matching', () => {
        const result = filterPagesByQuery(mockPages, 'confg') // typo for "config"
        expect(result.length).toBeGreaterThan(0)
        // Should match "Configuration" pages
        const titles = result.map(p => p.h1Title)
        expect(titles.some(title => title.includes('Configuration'))).toBe(true)
    })

    test('returns results in relevance order', () => {
        const result = filterPagesByQuery(mockPages, 'configuration')
        expect(result.length).toBeGreaterThan(0)
        // "Advanced Configuration" should rank higher than "Getting Started"
        expect(result[0].h1Title).toBe('Advanced Configuration')
    })

    test('handles case insensitive search', () => {
        const result = filterPagesByQuery(mockPages, 'api')
        expect(result.length).toBeGreaterThan(0)
        expect(result[0].h1Title).toBe('API Reference')
    })
})

describe('generateNavigation', () => {
    const mockPages: MarkdownPage[] = [
        {
            h1Title: 'Overview',
            h2Headings: ['Architecture', 'Features', 'Benefits'],
            summary: 'Project overview and main features',
            content: '# Overview\n\nContent...',
            size: 1500,
        },
        {
            h1Title: 'API Reference',
            h2Headings: [
                'REST API',
                'GraphQL API',
                'Authentication',
                'Rate Limiting',
                'Error Handling',
                'Webhooks',
            ],
            summary: 'Complete API documentation',
            content: '# API Reference\n\nAPI docs...',
            size: 3200,
        },
    ]

    test('generates navigation for normal pages', () => {
        const navigation = generateNavigation(mockPages, 'facebook/react', 5)

        expect(navigation).toContain('facebook/react')
        expect(navigation).toContain('### 1. Overview')
        expect(navigation).toContain('### 2. API Reference')
        expect(navigation).toContain('**Summary**: Project overview and main features')
        expect(navigation).toContain('**Main sections**: Architecture, Features, Benefits')
        expect(navigation).toContain('**Size**: 1,500 characters')
        expect(navigation).toContain('**Size**: 3,200 characters')
    })

    test('limits h2 headings to 5 items', () => {
        const navigation = generateNavigation(mockPages, 'test/repo', 5)

        // API Reference has 6 h2 headings, should show first 5 + "..."
        expect(navigation).toContain(
            'REST API, GraphQL API, Authentication, Rate Limiting, Error Handling...',
        )
        expect(navigation).not.toContain('Webhooks') // 6th item should be truncated
    })

    test('handles pages without h2 headings', () => {
        const pagesWithoutH2: MarkdownPage[] = [
            {
                h1Title: 'Simple Page',
                h2Headings: [],
                summary: 'A simple page without sections',
                content: '# Simple Page\n\nContent...',
                size: 800,
            },
        ]

        const navigation = generateNavigation(pagesWithoutH2, 'test/repo', 5)
        expect(navigation).toContain('**Main sections**: None')
    })

    test('handles empty pages array', () => {
        const navigation = generateNavigation([], 'test/repo', 5)
        expect(navigation).toBe('No wiki pages found for test/repo.')
    })

    test('includes selection instructions', () => {
        const navigation = generateNavigation(mockPages, 'facebook/react', 5)

        expect(navigation).toContain('Available Wiki Pages')
        expect(navigation).toContain('Selection Method')
        expect(navigation).toContain('choose up to 5 most relevant page titles')
    })
})

describe('applySizeLimit', () => {
    const longContent = 'A'.repeat(10000) // 30,000 characters

    test('applies maxTokens limit when set', () => {
        const settings: Settings = { maxTokens: 1000 }
        const result = applySizeLimit(longContent, settings)

        expect(result.length).toBeLessThan(longContent.length)
        expect(result).toContain('(content was truncated)')
    })

    test('preserves heading structure when truncating', () => {
        const contentWithHeadings = `# Main Title

This is the introduction.

## Section 1

Content for section 1.

## Section 2

Content for section 2.

### Subsection 2.1

Detailed content here.

## Section 3

More content that might be truncated.
`.repeat(100) // Make it long enough to trigger truncation

        const settings: Settings = { maxTokens: 500 }
        const result = applySizeLimit(contentWithHeadings, settings)

        expect(result).toContain('# Main Title')
        expect(result).toContain('(content was truncated)')
        // Should preserve some heading structure
        expect(result.match(/^#{1,3}\s+/gm)).toBeTruthy()
    })
})

describe('formatChatHistory', () => {
    test('formats basic chat history', () => {
        const chatData: ChatHistoryData = {
            title: 'Test Chat Session',
            queries: [
                {
                    user_query: 'How do I implement a React hook?',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [
                        { type: 'chunk', data: 'You can implement a React hook by ' },
                        { type: 'chunk', data: 'creating a function that starts with "use".' },
                    ],
                },
            ],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        expect(result).toContain('# Test Chat Session')
        expect(result).toContain('## Query 1')
        expect(result).toContain('**User Question:** How do I implement a React hook?')
        expect(result).toContain('**AI Response:**')
        expect(result).toContain('You can implement a React hook by creating a function that starts with "use".')
    })

    test('formats chat history without code references', () => {
        const chatData: ChatHistoryData = {
            title: 'Chat with References',
            queries: [
                {
                    user_query: 'Show me authentication code',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [
                        { type: 'chunk', data: 'Here is the authentication logic:' },
                        {
                            type: 'reference',
                            data: {
                                file_path: 'Repo github/example: src/auth.ts:10-20',
                                range_start: 15,
                                range_end: 25,
                            },
                        },
                    ],
                },
            ],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        // Code References should be skipped to reduce token usage
        expect(result).not.toContain('**Code References:**')
        expect(result).toContain('Here is the authentication logic:')
        expect(result).toContain('**User Question:** Show me authentication code')
    })

    test('formats chat history with multiple queries', () => {
        const chatData: ChatHistoryData = {
            title: 'Multi-Query Chat',
            queries: [
                {
                    user_query: 'First question',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [{ type: 'chunk', data: 'First answer' }],
                },
                {
                    user_query: 'Second question',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [{ type: 'chunk', data: 'Second answer' }],
                },
            ],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        expect(result).toContain('## Query 1')
        expect(result).toContain('**User Question:** First question')
        expect(result).toContain('First answer')
        expect(result).toContain('## Query 2')
        expect(result).toContain('**User Question:** Second question')
        expect(result).toContain('Second answer')
        expect(result.split('---').length).toBe(3) // Two separators plus content
    })

    test('handles empty chat history', () => {
        const chatData: ChatHistoryData = {
            title: 'Empty Chat',
            queries: [],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        expect(result).toBe('No chat history available.')
    })

    test('handles chat history with no chunks', () => {
        const chatData: ChatHistoryData = {
            title: 'No Chunks Chat',
            queries: [
                {
                    user_query: 'Question with no response',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [
                        { type: 'stats', data: {} },
                        { type: 'done' },
                    ],
                },
            ],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        expect(result).toContain('**User Question:** Question with no response')
        expect(result).not.toContain('**AI Response:**')
    })

    test('filters non-chunk and non-reference items', () => {
        const chatData: ChatHistoryData = {
            title: 'Mixed Response Types',
            queries: [
                {
                    user_query: 'Complex response',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [
                        { type: 'loading_indexes', data: {} },
                        { type: 'chunk', data: 'Actual content' },
                        { type: 'stats', data: {} },
                        { type: 'done' },
                    ],
                },
            ],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        expect(result).toContain('**AI Response:**')
        expect(result).toContain('Actual content')
        expect(result).not.toContain('loading_indexes')
        expect(result).not.toContain('stats')
        expect(result).not.toContain('done')
    })

    test('cleans title with relevant_context tags', () => {
        const chatData: ChatHistoryData = {
            title: '<relevant_context>This query was sent from the wiki page: Overview.</relevant_context>コード検索関係の機能はある?',
            queries: [
                {
                    user_query: 'Test question',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [{ type: 'chunk', data: 'Test answer' }],
                },
            ],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        expect(result).toContain('# コード検索関係の機能はある?')
        expect(result).not.toContain('<relevant_context>')
        expect(result).not.toContain('This query was sent from the wiki page: Overview.')
    })

    test('handles title with multiple relevant_context tags', () => {
        const chatData: ChatHistoryData = {
            title: '<relevant_context>Context 1</relevant_context>Main Title<relevant_context>Context 2</relevant_context>',
            queries: [
                {
                    user_query: 'Test question',
                    use_knowledge: true,
                    engine_id: 'test',
                    repo_context_ids: ['repo1'],
                    response: [{ type: 'chunk', data: 'Test answer' }],
                },
            ],
        }

        const result = formatChatHistory(chatData, { maxTokens: 3000 })

        expect(result).toContain('# Main Title')
        expect(result).not.toContain('<relevant_context>')
        expect(result).not.toContain('Context 1')
        expect(result).not.toContain('Context 2')
    })
})

describe('cleanTitle', () => {
    test('removes single relevant_context tag', () => {
        const title = '<relevant_context>This query was sent from the wiki page: Overview.</relevant_context>コード検索関係の機能はある?'
        const result = cleanTitle(title)
        
        expect(result).toBe('コード検索関係の機能はある?')
        expect(result).not.toContain('<relevant_context>')
    })

    test('removes multiple relevant_context tags', () => {
        const title = '<relevant_context>Context 1</relevant_context>Main Title<relevant_context>Context 2</relevant_context>'
        const result = cleanTitle(title)
        
        expect(result).toBe('Main Title')
        expect(result).not.toContain('<relevant_context>')
    })

    test('handles title without relevant_context tags', () => {
        const title = 'Normal title without tags'
        const result = cleanTitle(title)
        
        expect(result).toBe('Normal title without tags')
    })

    test('handles empty title', () => {
        const title = ''
        const result = cleanTitle(title)
        
        expect(result).toBe('')
    })

    test('handles title with only relevant_context tags', () => {
        const title = '<relevant_context>Only context here</relevant_context>'
        const result = cleanTitle(title)
        
        expect(result).toBe('')
    })
})
