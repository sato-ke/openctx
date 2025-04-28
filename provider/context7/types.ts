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

// Version state is still needed for validating search results
export type DocumentState =
  | "initial"
  | "parsed"
  | "finalized"
  | "invalid_docs"
  | "error"
  | "stop"
  | "delete";

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

