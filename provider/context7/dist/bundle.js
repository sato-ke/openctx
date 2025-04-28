// ../../node_modules/.pnpm/quick-lru@7.0.1/node_modules/quick-lru/index.js
var QuickLRU = class extends Map {
  #size = 0;
  #cache = /* @__PURE__ */ new Map();
  #oldCache = /* @__PURE__ */ new Map();
  #maxSize;
  #maxAge;
  #onEviction;
  constructor(options = {}) {
    super();
    if (!(options.maxSize && options.maxSize > 0)) {
      throw new TypeError("`maxSize` must be a number greater than 0");
    }
    if (typeof options.maxAge === "number" && options.maxAge === 0) {
      throw new TypeError("`maxAge` must be a number greater than 0");
    }
    this.#maxSize = options.maxSize;
    this.#maxAge = options.maxAge || Number.POSITIVE_INFINITY;
    this.#onEviction = options.onEviction;
  }
  // For tests.
  get __oldCache() {
    return this.#oldCache;
  }
  #emitEvictions(cache) {
    if (typeof this.#onEviction !== "function") {
      return;
    }
    for (const [key, item] of cache) {
      this.#onEviction(key, item.value);
    }
  }
  #deleteIfExpired(key, item) {
    if (typeof item.expiry === "number" && item.expiry <= Date.now()) {
      if (typeof this.#onEviction === "function") {
        this.#onEviction(key, item.value);
      }
      return this.delete(key);
    }
    return false;
  }
  #getOrDeleteIfExpired(key, item) {
    const deleted = this.#deleteIfExpired(key, item);
    if (deleted === false) {
      return item.value;
    }
  }
  #getItemValue(key, item) {
    return item.expiry ? this.#getOrDeleteIfExpired(key, item) : item.value;
  }
  #peek(key, cache) {
    const item = cache.get(key);
    return this.#getItemValue(key, item);
  }
  #set(key, value) {
    this.#cache.set(key, value);
    this.#size++;
    if (this.#size >= this.#maxSize) {
      this.#size = 0;
      this.#emitEvictions(this.#oldCache);
      this.#oldCache = this.#cache;
      this.#cache = /* @__PURE__ */ new Map();
    }
  }
  #moveToRecent(key, item) {
    this.#oldCache.delete(key);
    this.#set(key, item);
  }
  *#entriesAscending() {
    for (const item of this.#oldCache) {
      const [key, value] = item;
      if (!this.#cache.has(key)) {
        const deleted = this.#deleteIfExpired(key, value);
        if (deleted === false) {
          yield item;
        }
      }
    }
    for (const item of this.#cache) {
      const [key, value] = item;
      const deleted = this.#deleteIfExpired(key, value);
      if (deleted === false) {
        yield item;
      }
    }
  }
  get(key) {
    if (this.#cache.has(key)) {
      const item = this.#cache.get(key);
      return this.#getItemValue(key, item);
    }
    if (this.#oldCache.has(key)) {
      const item = this.#oldCache.get(key);
      if (this.#deleteIfExpired(key, item) === false) {
        this.#moveToRecent(key, item);
        return item.value;
      }
    }
  }
  set(key, value, { maxAge = this.#maxAge } = {}) {
    const expiry = typeof maxAge === "number" && maxAge !== Number.POSITIVE_INFINITY ? Date.now() + maxAge : void 0;
    if (this.#cache.has(key)) {
      this.#cache.set(key, {
        value,
        expiry
      });
    } else {
      this.#set(key, { value, expiry });
    }
    return this;
  }
  has(key) {
    if (this.#cache.has(key)) {
      return !this.#deleteIfExpired(key, this.#cache.get(key));
    }
    if (this.#oldCache.has(key)) {
      return !this.#deleteIfExpired(key, this.#oldCache.get(key));
    }
    return false;
  }
  peek(key) {
    if (this.#cache.has(key)) {
      return this.#peek(key, this.#cache);
    }
    if (this.#oldCache.has(key)) {
      return this.#peek(key, this.#oldCache);
    }
  }
  delete(key) {
    const deleted = this.#cache.delete(key);
    if (deleted) {
      this.#size--;
    }
    return this.#oldCache.delete(key) || deleted;
  }
  clear() {
    this.#cache.clear();
    this.#oldCache.clear();
    this.#size = 0;
  }
  resize(newSize) {
    if (!(newSize && newSize > 0)) {
      throw new TypeError("`maxSize` must be a number greater than 0");
    }
    const items = [...this.#entriesAscending()];
    const removeCount = items.length - newSize;
    if (removeCount < 0) {
      this.#cache = new Map(items);
      this.#oldCache = /* @__PURE__ */ new Map();
      this.#size = items.length;
    } else {
      if (removeCount > 0) {
        this.#emitEvictions(items.slice(0, removeCount));
      }
      this.#oldCache = new Map(items.slice(removeCount));
      this.#cache = /* @__PURE__ */ new Map();
      this.#size = 0;
    }
    this.#maxSize = newSize;
  }
  *keys() {
    for (const [key] of this) {
      yield key;
    }
  }
  *values() {
    for (const [, value] of this) {
      yield value;
    }
  }
  *[Symbol.iterator]() {
    for (const item of this.#cache) {
      const [key, value] = item;
      const deleted = this.#deleteIfExpired(key, value);
      if (deleted === false) {
        yield [key, value.value];
      }
    }
    for (const item of this.#oldCache) {
      const [key, value] = item;
      if (!this.#cache.has(key)) {
        const deleted = this.#deleteIfExpired(key, value);
        if (deleted === false) {
          yield [key, value.value];
        }
      }
    }
  }
  *entriesDescending() {
    let items = [...this.#cache];
    for (let i = items.length - 1; i >= 0; --i) {
      const item = items[i];
      const [key, value] = item;
      const deleted = this.#deleteIfExpired(key, value);
      if (deleted === false) {
        yield [key, value.value];
      }
    }
    items = [...this.#oldCache];
    for (let i = items.length - 1; i >= 0; --i) {
      const item = items[i];
      const [key, value] = item;
      if (!this.#cache.has(key)) {
        const deleted = this.#deleteIfExpired(key, value);
        if (deleted === false) {
          yield [key, value.value];
        }
      }
    }
  }
  *entriesAscending() {
    for (const [key, value] of this.#entriesAscending()) {
      yield [key, value.value];
    }
  }
  get size() {
    if (!this.#size) {
      return this.#oldCache.size;
    }
    let oldCacheSize = 0;
    for (const key of this.#oldCache.keys()) {
      if (!this.#cache.has(key)) {
        oldCacheSize++;
      }
    }
    return Math.min(this.#size + oldCacheSize, this.#maxSize);
  }
  get maxSize() {
    return this.#maxSize;
  }
  entries() {
    return this.entriesAscending();
  }
  forEach(callbackFunction, thisArgument = this) {
    for (const [key, value] of this.entriesAscending()) {
      callbackFunction.call(thisArgument, value, key, this);
    }
  }
  get [Symbol.toStringTag]() {
    return "QuickLRU";
  }
  toString() {
    return `QuickLRU(${this.size}/${this.maxSize})`;
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toString();
  }
};

// api.ts
var CONTEXT7_API_BASE_URL = "https://context7.com/api";
var searchCache = new QuickLRU({ maxSize: 500, maxAge: 1e3 * 60 * 30 });
function debounce(fn, timeout, cancelledReturn) {
  let controller = new AbortController();
  let timeoutId;
  return (...args) => {
    return new Promise((resolve) => {
      controller.abort();
      controller = new AbortController();
      const { signal } = controller;
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
      }, timeout);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        resolve(cancelledReturn);
      });
    });
  };
}
var searchLibraries = debounce(_searchLibraries, 300, { results: [] });
async function _searchLibraries(query) {
  const cacheKey = `search-${query}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }
  try {
    const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/search`);
    url.searchParams.set("query", query);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to search libraries: ${response.status}`);
      return null;
    }
    const data = await response.json();
    searchCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error searching libraries:", error);
    return null;
  }
}
async function fetchLibraryDocumentation(libraryId, format, tokens, options = {}) {
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
        "X-Context7-Source": "mcp-server"
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch documentation: ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text || text === "No content available" || text === "No context data available") {
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
function processJsonResponse(jsonText) {
  try {
    const data = JSON.parse(jsonText);
    const formattedData = data.map((item) => ({
      id: item.codeId,
      title: item.codeTitle,
      description: item.codeDescription,
      lang: item.codeLanguage,
      page: item.pageTitle,
      codes: item.codeList.map((item2) => item2.code)
    }));
    return JSON.stringify(formattedData);
  } catch (error) {
    console.error("Error processing JSON response:", error);
    return jsonText;
  }
}

// index.ts
var checkSettings = (settings) => {
  const missingKeys = ["format", "tokens"].filter((key) => !(key in settings));
  if (missingKeys.length > 0) {
    throw new Error(`Missing settings: ${JSON.stringify(missingKeys)}`);
  }
};
var CONTEXT7_BASE_URL = "https://context7.com";
var Context7Provider = {
  meta(params, settings) {
    return {
      name: "Context7",
      mentions: { label: "type `{repository query}.{topic keyword}`" }
    };
  },
  async mentions(params, settings) {
    checkSettings(settings);
    if (params.query === void 0 || params.query.length === 0) {
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
        topic: topicKeyword
      }
    }));
  },
  async items(params, settings) {
    checkSettings(settings);
    if (params.mention?.data?.id === void 0) {
      return [];
    }
    const { id, topic } = params.mention.data;
    const response = await fetchLibraryDocumentation(id, settings.format, settings.tokens, {
      topic
    });
    if (!response) {
      return [];
    }
    return [
      {
        title: `context7 docs for repository: ${id} / topic: ${topic}`,
        url: `${CONTEXT7_BASE_URL}/${id}/llms.${settings.format ?? "txt"}?topic=${topic}tokens=${settings.tokens}`,
        ui: { hover: { text: `${id}#${topic}` } },
        ai: { content: response }
      }
    ];
  }
};
var context7_default = Context7Provider;
export {
  context7_default as default
};
