/**
 * Format a search result into a string representation
 * @param result SearchResult to format
 * @returns Formatted search result string
 */
export function formatSearchResult(result) {
    return `Title: ${result.title}\n\nContext7-compatible library ID: ${result.id}\n\nDescription: ${result.description}`;
}
/**
 * Format search results into a string representation
 * @param searchResponse The search response to format
 * @returns Formatted search results string
 */
export function formatSearchResults(searchResponse) {
    if (!searchResponse.results || searchResponse.results.length === 0) {
        return "No documentation libraries found matching your query.";
    }
    const formattedResults = searchResponse.results.map(formatSearchResult);
    return formattedResults.join("\n\n--------------------\n");
}
//# sourceMappingURL=utils.js.map