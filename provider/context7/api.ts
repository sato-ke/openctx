import { Cache } from "./cache.js";
import { SearchResponse, JsonDocs } from './types.js';

const CONTEXT7_API_BASE_URL = "https://context7.com/api";
const searchCache = new Cache<SearchResponse | null>({ ttlMS: 1000 * 60 * 5 });

/**
 * Searches for libraries matching the given query
 * @param query The search query
 * @returns Search results or null if the request fails
 */
export async function searchLibraries(query: string): Promise<SearchResponse | null> {
	return await searchCache.getOrFill(query, async () => {
		try {
			const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/search`);
			url.searchParams.set("query", query);
			const response = await fetch(url);
			if (!response.ok) {
				console.error(`Failed to search libraries: ${response.status}`);
				return null;
			}
			return await response.json() as SearchResponse;
		} catch (error) {
			console.error("Error searching libraries:", error);
			return null;
		}
	})
}

/**
 * Fetches documentation context for a specific library
 * @param libraryId The library ID to fetch documentation for
 * @param options Options for the request
 * @returns The documentation text or null if the request fails
 */
export async function fetchLibraryDocumentation(
  libraryId: string,
  format: 'txt' | 'json',
  tokens: number,
  options: {
    topic?: string;
  } = {}
): Promise<string | null> {
  try {
    if (libraryId.startsWith("/")) {
      libraryId = libraryId.slice(1);
    }
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/${libraryId}`);
    url.searchParams.set("tokens", tokens.toString());
    url.searchParams.set("type", format);
    if (options.topic) url.searchParams.set("topic", options.topic);
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
    if (
      !text ||
      text === "No content available" ||
      text === "No context data available"
    ) {
      return null;
    }

    if (format === "json") {
      return processJsonResponse(text);
    }

    return text;
  } catch (error) {
    console.error("Error fetching library documentation:", error);
    return null;
  }
}



/**
 * Process JSON response and convert it to a specific format
 *
 * @param {string} jsonText - The JSON text to process
 * @returns {string} Converted JSON text, or the original text if processing fails
 */
export function processJsonResponse(jsonText: string): string {
  try {
    const data = JSON.parse(jsonText) as JsonDocs[];
    const formattedData = data.map((item) => ({
      id: item.codeId,
      title: item.codeTitle,
      description: item.codeDescription,
      lang: item.codeLanguage,
      page: item.pageTitle,
      codes: item.codeList.map((item) => item.code),
    }));
    return JSON.stringify(formattedData);
  } catch (error) {
    console.error("Error processing JSON response:", error);
    return jsonText;
  }
}
