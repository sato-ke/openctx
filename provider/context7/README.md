# Context7 context provider for OpenCtx

[OpenCtx](https://openctx.org) context provider for bringing Context7 repository documentation into code AI and editors.

## Usage

Configure your OpenCtx client:

```json
"openctx.providers": {
    // ...other providers...
    "https://openctx.org/npm/@openctx/provider-context7": {
        "format": "txt",
        "tokens": 1000
    }
}
```

## Mention support

- Type `{repository query}.{topic keyword}` to search for repositories and specific topics
- Searches for repositories matching your query and returns up to 20 results
- Use the topic keyword to filter documentation by specific topics

## Context included

Repository documentation:

- URL to the specific repository and topic
- Documentation content filtered by the specified topic
- Content is formatted based on your settings

## Configuration

- `format` — Output format — Required (e.g. `"txt"` or `"json"`)
- `tokens` — Maximum number of tokens to return — Required (e.g. `1000`)

## Development

- License: Apache 2.0
