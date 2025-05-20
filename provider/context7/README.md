# Context7 context provider for OpenCtx

[OpenCtx](https://openctx.org) context provider for bringing Context7 repository documentation into code AI and editors.

## Usage

Configure your OpenCtx client:

```json
"openctx.providers": {
    // ...other providers...
    "https://raw.githubusercontent.com/sato-ke/openctx/refs/heads/feature/provider/context7/dist/bundle.js": {
        "tokens": 6000,         // Maximum number of tokens to return (required)
        "mentionLimit": 2       // (Optional) Maximum number of mentions to return (default: 3, max: 20)
    }
}
```

### How to use in your editor

- To search for repository documentation, type a query in the form:
  - `@context7 {repository query}`
    e.g. `@context7 react`
  - `@context7 {repository query}.{topic keyword}`
    e.g. `@context7 react.hooks`
- The `topic keyword` is optional. If omitted, you will get general documentation for the repository.

## Features

- Supports filtering documentation by repository and topic keyword
- Configurable mention result limit to avoid hitting API rate limits (default: 3, max: 20)

## Context included

Repository documentation:

- URL to the specific repository and topic
- Documentation content filtered by the specified topic (if provided)
- Content is formatted as plain text

## Configuration

- `tokens` — Maximum number of tokens to return (required). Example: `6000`.
- `mentionLimit` — (Optional) Maximum number of mentions to return per search (default: 3, max: 20).
  This setting helps prevent hitting API rate limits by limiting the number of documentation fetches triggered by AI agents.

## Development

- License: Apache 2.0
