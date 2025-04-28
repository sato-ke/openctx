import { SearchResponse } from './types.js';
/**
 * Searches for libraries matching the given query
 * @param query The search query
 * @returns Search results or null if the request fails
 */
export declare const searchLibraries: (query: string) => Promise<SearchResponse | null>;
export declare function _searchLibraries(query: string): Promise<SearchResponse | null>;
/**
 * Fetches documentation context for a specific library
 * @param libraryId The library ID to fetch documentation for
 * @param options Options for the request
 * @returns The documentation text or null if the request fails
 */
export declare function fetchLibraryDocumentation(libraryId: string, format: 'txt' | 'json', tokens: number, options?: {
    topic?: string;
}): Promise<string | null>;
/**
 * Process JSON response and convert it to a specific format
 *
 * @param {string} jsonText - The JSON text to process
 * @returns {string} Converted JSON text, or the original text if processing fails
 */
export declare function processJsonResponse(jsonText: string): string;
//# sourceMappingURL=api.d.ts.map