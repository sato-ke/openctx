export interface SearchResult {
    id: string;
    title: string;
    description?: string;
    branch: string;
    lastUpdate: string;
    state: DocumentState;
    totalTokens: number;
    totalSnippets: number;
    totalPages: number;
}
export interface SearchResponse {
    results: SearchResult[];
}
export type DocumentState = "initial" | "parsed" | "finalized" | "invalid_docs" | "error" | "stop" | "delete";
//# sourceMappingURL=types.d.ts.map