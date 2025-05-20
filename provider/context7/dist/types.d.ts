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
    stars: number;
    trustScore: number;
}
export interface SearchResponse {
    results: SearchResult[];
}
export type DocumentState = 'initial' | 'parsed' | 'finalized' | 'invalid_docs' | 'error' | 'stop' | 'delete';
export interface JsonDocs {
    codeTitle: string;
    codeDescription: string;
    codeLanguage: string;
    codeTokens: number;
    codeId: string;
    pageTitle: string;
    codeList: Array<{
        language: string;
        code: string;
    }>;
    relevance: number;
}
//# sourceMappingURL=types.d.ts.map