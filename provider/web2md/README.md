# OpenCtx Web to Markdown Provider

This provider converts web articles to Markdown format for use in OpenCtx.

## Features

- Converts web articles to clean Markdown format
- Supports Qiita articles with optimized extraction
- Removes images, scripts, and unnecessary elements
- Simplifies code blocks for better readability
- Configurable timeout and content length limits

## Usage

Configure in your OpenCtx settings:

```json
{
  "openctx.providers": {
    "https://openctx.org/npm/@openctx/web2md": {
      "userAgent": "openctx-web2md/1.0.0",
      "requestTimeout": 10000,
      "maxContentLength": 50000
    }
  }
}
```

Then mention a URL in your code:

```typescript
// @openctx https://qiita.com/user/items/123456
```

## Supported Sites

### Qiita

- Pattern: `https://qiita.com/{user}/items/{id}`
- Optimized content extraction using `.it-MdContent` selector
- Title extraction from `<h1>` or `og:title` meta tag

### Other Sites

For unsupported sites, the provider will attempt to extract content from the entire `<body>` element.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `userAgent` | string | `openctx-web2md/1.0.0` | User-Agent header for HTTP requests |
| `requestTimeout` | number | `10000` | Request timeout in milliseconds |
| `maxContentLength` | number | `50000` | Maximum content length in characters |

## Output Format

The provider returns Markdown content with the following format:

```markdown
<!--
Fetched from: [URL]
Converted by: OpenCtx web2md provider
Processing: Removed images, scripts, and normalized code blocks using Turndown
-->

# [Article Title]

[Converted content...]
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Try the demo client
pnpm demo

# Convert a URL to Markdown file
pnpm convert https://example.com

# Build
pnpm run bundle
```