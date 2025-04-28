const CONTEXT7_BASE_URL = "https://context7.com";
const CONTEXT7_API_BASE_URL = "https://context7.com/api";
const DEFAULT_TYPE = "txt";
class Cache {
    cache = new Map();
    timeoutMS;
    constructor(opts) {
        this.timeoutMS = opts.ttlMS;
    }
    async getOrFill(key, fill) {
        const entry = this.cache.get(key);
        if (entry) {
            return entry.value;
        }
        const value = await fill();
        this.cache.set(key, { value });
        const timeout = setTimeout(() => this.cache.delete(key), this.timeoutMS);
        if (typeof timeout !== "number" && "unref" in timeout)
            timeout.unref();
        return value;
    }
}
const cache = new Cache({ ttlMS: 1000 * 60 * 5 });
const checkSettings = (settings) => {
    const missingKeys = ["format", "tokens"].filter((key) => !(key in settings));
    if (missingKeys.length > 0) {
        throw new Error(`Missing settings: ${JSON.stringify(missingKeys)}`);
    }
};
const Context7Provider = {
    meta(params, settings) {
        return {
            name: "Context7",
            mentions: { label: "type `{repository query}.{topic keyword}`" },
        };
    },
    async mentions(params, settings) {
        checkSettings(settings);
        if (params.query === undefined || params.query.length === 0) {
            return [];
        }
        const query = params.query.toLowerCase();
        const [repositoryQuery, topicKeyword] = query.split(".");
        const libraries = await cache.getOrFill(repositoryQuery, async () => {
            const response = await searchLibraries(repositoryQuery);
            if (!response || response.results.length === 0) {
                return [];
            }
            return response.results.slice(0, 20);
        });
        return libraries.map((result) => ({
            title: result.title,
            uri: `${CONTEXT7_BASE_URL}/${result.id}`,
            description: `${result.description} [${result.totalTokens}]`,
            data: {
                id: result.id,
                topic: topicKeyword,
            },
        }));
    },
    async items(params, settings) {
        checkSettings(settings);
        if (params.mention?.data?.id === undefined) {
            return [];
        }
        const { id, topic } = params.mention.data;
        const response = await fetchLibraryDocumentation(id, {
            tokens: settings.tokens,
            topic: topic,
        });
        if (!response) {
            return [];
        }
        return [
            {
                title: `context7 docs for repository: ${id} / topic: ${topic}`,
                url: `${CONTEXT7_BASE_URL}/${id}/llms.${settings.format ?? "txt"}?topic=${topic}tokens=${settings.tokens}`,
                ui: { hover: { text: `${id}#${topic}` } },
                ai: { content: response },
            },
        ];
    },
};
/**
 * Searches for libraries matching the given query
 * @param query The search query
 * @returns Search results or null if the request fails
 */
async function searchLibraries(query) {
    try {
        const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/search`);
        url.searchParams.set("query", query);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to search libraries: ${response.status}`);
            return null;
        }
        const json = await response.json();
        return json;
    }
    catch (error) {
        console.error("Error searching libraries:", error);
        return null;
    }
}
/**
 * Fetches documentation context for a specific library
 * @param libraryId The library ID to fetch documentation for
 * @param options Options for the request
 * @returns The documentation text or null if the request fails
 */
async function fetchLibraryDocumentation(libraryId, options = {}) {
    try {
        if (libraryId.startsWith("/")) {
            libraryId = libraryId.slice(1);
        }
        const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/${libraryId}`);
        const type = options.type ?? DEFAULT_TYPE;
        if (options.tokens)
            url.searchParams.set("tokens", options.tokens.toString());
        if (options.topic)
            url.searchParams.set("topic", options.topic);
        if (options.folders)
            url.searchParams.set("folders", options.folders);
        if (options.type)
            url.searchParams.set("type", type);
        const response = await fetch(url, {
            headers: {
                "X-Context7-Source": "mcp-server",
            },
        });
        if (!response.ok) {
            console.error(`Failed to fetch documentation: ${response.status}`);
            return null;
        }
        const text = await response.text();
        if (!text ||
            text === "No content available" ||
            text === "No context data available") {
            return null;
        }
        return text;
    }
    catch (error) {
        console.error("Error fetching library documentation:", error);
        return null;
    }
}
export default Context7Provider;
//# sourceMappingURL=index.js.map