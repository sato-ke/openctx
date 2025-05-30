# deepwiki

[OpenCtx](https://openctx.org) context provider for bringing GitHub repository wiki pages from deepwiki.com into code AI and editors.

## Usage

Configure your OpenCtx client:

```json
"openctx.providers": {
    // ...other providers...
    "https://raw.githubusercontent.com/sato-ke/openctx/refs/heads/feat/deepwiki/provider/deepwiki/dist/bundle.js": {
        "maxMentionItems": 3,      // (Optional) Maximum number of mentions to return (default: 5, max: 20)
        "maxTokens": 4000,         // (Optional) Maximum number of tokens per content (default: 3000, max: 20000)
        // "debounceDelay": 300,      // (Optional) Debounce delay in ms (default: 300, range: 100-1000)
        // "enableNavigation": true   // (Optional) Enable navigation mode (default: true)
    }
}
```

### How to use in your editor

- To browse repository wiki pages, type a query in the form:
  - `@deepwiki <user/repo>` - Shows navigation menu for all wiki pages
  - `@deepwiki <user/repo> [search query]` - Searches specific wiki pages
  - `@deepwiki <user/repo> [page numbers]` - AI can access specific pages by number after navigation (e.g., `1/3/5` or `17`)
  - `@deepwiki <github-url>` - Also accepts GitHub URLs

Examples:
- `@deepwiki facebook/react` - Browse React wiki navigation
- `@deepwiki facebook/react hooks` - Search for pages about hooks
- `@deepwiki facebook/react 1/4/9` - AI fetches pages 1, 4, and 9 (after seeing navigation)
- `@deepwiki facebook/react 17` - AI fetches page 17 (numbers only known from navigation)
- `@deepwiki https://github.com/microsoft/vscode` - Browse VS Code wiki
- `@deepwiki vercel/next.js api` - Search Next.js wiki for API documentation

## Features

- **Smart Navigation**: When no search query is provided, shows an AI-assisted navigation menu of all available wiki pages
- **Page Number Selection**: AI can directly access specific pages using numbers from navigation (e.g., `1/3/5`)
- **Fuzzy Search**: Intelligent search across page titles, headings, and content summaries
- **Content Optimization**: Automatically truncates long content while preserving markdown structure
- **GitHub URL Support**: Accepts both `user/repo` format and full GitHub URLs
- **Caching**: Built-in caching to improve performance and reduce API calls

## Context included

Repository wiki documentation:
- Page titles and section headings (h1, h2)
- Content summaries from h1 headings
- Full markdown content with size limits applied
- Navigation assistance for discovering relevant pages
- Direct page access by number for efficient content retrieval

## Configuration

- `maxMentionItems` — (Optional) Maximum number of mention items to return (default: 5, range: 1-20). Controls how many wiki pages are shown in search results and limits the maximum number of pages that can be selected at once in navigation mode.
- `maxTokens` — (Optional) Maximum number of tokens per markdown content (default: 3000, range: 1000-20000). Larger values include more content but may hit AI context limits.
- `debounceDelay` — (Optional) Debounce delay in milliseconds for mention calls (default: 300, range: 100-1000). Prevents excessive API calls during typing.
- `enableNavigation` — (Optional) Whether to enable navigation mode when no search query is provided (default: true). When disabled, returns individual pages instead of navigation menu.

## Recommended VS Code Settings

To optimize AI interaction with deepwiki provider, add this to your `cody.chat.preInstruction`:

```json
{
  "cody.chat.preInstruction": "### deepwiki provider usage\n`@deepwiki <user/repo>` - Get wiki navigation to see available pages and their numbers\n`@deepwiki <user/repo> [page numbers]` - Get specific pages using numbers from navigation (e.g., 1/3/5)\n\n#### Important notes:\n- Page numbers are only available after seeing navigation first\n- For deep research: (1) get navigation, (2) identify relevant pages, (3) fetch specific pages by number"
}
```

**Key points for AI behavior**:
- Always start with navigation (`@deepwiki <user/repo>`) to understand available content
- Page numbers are provider-generated and only visible in navigation responses
- Use specific page numbers for targeted content retrieval

## How it works

1. **Input Parsing**: Accepts repository names in `user/repo` format or GitHub URLs
2. **Query Processing**: Detects page numbers (e.g., `1/3/5`), search queries, or requests for navigation
3. **Content Fetching**: Retrieves wiki content from deepwiki.com
4. **Markdown Processing**: Extracts and parses markdown pages from the HTML response
5. **Page Selection**: Returns specific pages by number, filtered search results, or navigation assistance
6. **Content Optimization**: Applies token limits while preserving document structure
7. **AI Integration**: Provides structured content for AI assistants

## Limitations

⚠️ **Important**: This provider only works with repositories that meet the following criteria:

- **Public repositories only**: Private repositories are not accessible through this provider
- **Must be indexed by deepwiki.com**: If the repository is not yet indexed, please index it on deepwiki.com before using this provider.
- **Must have sufficient source code**: If the repository does not contain enough source code, content retrieval may not work properly

If you encounter a "Repository not found" error, it likely means the repository is either private or not indexed by deepwiki.com.

## Use Cases

This provider supports three main workflow patterns for accessing wiki documentation:

### 1. Search-Based Access
**Goal**: Find specific information using search terms.

**Steps**:
1. **User**: `@deepwiki <user/repo> <search_query>` (e.g., `@deepwiki sourcegraph/cody authentication`) + select from the filtered search results
2. **AI**: Provides information based on the selected page content

**Best for**: When you know what you're looking for and need quick access to specific topics.

### 2. Navigation-Based Overview (Shallow Understanding)
**Goal**: Understand the overall wiki structure and get a broad view of the project.

**Steps**:
1. **User**: `@deepwiki <user/repo>` (select navigation) + "What documentation is available? Give me an overview of this project."
2. **AI**: Explains the wiki structure and provides high-level project understanding

**Best for**: Project onboarding, getting familiar with available documentation, understanding project scope.

### 3. Navigation-Based Deep Research
**Goal**: Have AI comprehensively research wiki content and provide detailed analysis or deliverables.

**Steps**:
1. **User**: `@deepwiki <user/repo>` (select navigation) + "Please understand this wiki structure and familiarize yourself with the content"
2. **AI**: Responds with understanding of wiki structure and available pages
3. **User**: "I need information about [your specific requirement]. Find relevant pages and get the details (use deepwiki)"
4. **AI**: Identifies relevant pages and fetches them: `@deepwiki <user/repo> X/Y/Z`
5. **User**: Follow up with specific tasks:
   - "Summarize this information in markdown format"
   - "Based on this documentation, write code for [specific feature]"
   - "Create implementation guidelines based on these pages"

**Example conversation**:
1. User: @deepwiki sourcegraph/cody (select navigation) + "Please understand this wiki structure and familiarize yourself with the content"
2. AI: "I can see the Cody wiki has 26 pages covering architecture, VS Code integration, agent system..."
3. User: "I want to understand how Cody integrates with different IDEs. Find the relevant pages and give me a comprehensive overview (use deepwiki)"
4. AI: Let me get the relevant documentation about IDE integration.
  @deepwiki sourcegraph/cody 2/17/18/23
5. AI: "Based on the VS Code Extension, Agent Architecture, and JetBrains integration pages, here's a comprehensive overview..."

## Development
- License: Apache 2.0
