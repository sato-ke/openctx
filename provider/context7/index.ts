import type {
  ItemsParams,
  ItemsResult,
  MentionsParams,
  MentionsResult,
  MetaParams,
  MetaResult,
  Provider,
} from "@openctx/provider";
import { searchLibraries, fetchLibraryDocumentation } from "./api.js";

type Settings = {
  format: "txt" | "json";
  tokens: number;
};

const checkSettings = (settings: Settings) => {
  const missingKeys = ["format", "tokens"].filter((key) => !(key in settings));
  if (missingKeys.length > 0) {
    throw new Error(`Missing settings: ${JSON.stringify(missingKeys)}`);
  }
};

const CONTEXT7_BASE_URL = "https://context7.com";

const Context7Provider: Provider = {
  meta(params: MetaParams, settings: Settings): MetaResult {
    return {
      name: "Context7",
      mentions: { label: "type `{repository query}.{topic keyword}`" },
    };
  },

  async mentions(
    params: MentionsParams,
    settings: Settings
  ): Promise<MentionsResult> {
    checkSettings(settings);

    if (params.query === undefined || params.query.length === 0) {
      return [];
    }
    const query = params.query.toLowerCase();
    const [repositoryQuery, topicKeyword] = query.split(".");

    const response = await searchLibraries(repositoryQuery);

    if (!response || response.results.length === 0) {
      return [];
    }

    const libraries = response.results.slice(0, 20);

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

  async items(params: ItemsParams, settings: Settings): Promise<ItemsResult> {
    checkSettings(settings);

    if (params.mention?.data?.id === undefined) {
      return [];
    }

    const { id, topic } = params.mention.data as { id: string; topic: string };
    const response = await fetchLibraryDocumentation(id, settings.format, settings.tokens, {
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

export default Context7Provider;
