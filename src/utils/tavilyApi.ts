/**
 * Tavily Search API Client
 *
 * This module handles communication with the Tavily Search API via the
 * @tavily/core SDK. It provides the same two-variant pattern used by
 * braveApi.ts:
 *
 *   - "Raw" version (performTavilySearchRaw): Returns raw JSON string
 *   - "Formatted" version (performTavilySearch): Returns human-readable text
 *
 * Authentication: Uses the TAVILY_API_KEY environment variable.
 */

import { tavily } from "@tavily/core";
import { TAVILY_API_KEY } from "../config.js";

function getClient() {
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not configured");
  }
  return tavily({ apiKey: TAVILY_API_KEY });
}

/** Raw Tavily web search — returns the full API response as a JSON string. */
export async function performTavilySearchRaw(
  query: string,
  count: number = 10,
  offset: number = 0
): Promise<string> {
  const client = getClient();

  const response = await client.search(query, {
    maxResults: Math.min(count, 20),
    searchDepth: "basic",
    topic: "general",
  });

  // Tavily doesn't natively support offset; trim the front when offset > 0
  if (offset > 0 && response.results) {
    response.results = response.results.slice(offset);
  }

  return JSON.stringify(response);
}

/** Formatted Tavily web search — returns human-readable text (title, content, URL). */
export async function performTavilySearch(
  query: string,
  count: number = 10,
  offset: number = 0
): Promise<string> {
  const raw = await performTavilySearchRaw(query, count, offset);
  const data = JSON.parse(raw) as {
    results?: Array<{
      title: string;
      content: string;
      url: string;
      score?: number;
    }>;
  };

  const results = (data.results || []).map((result) => ({
    title: result.title || "",
    description: result.content || "",
    url: result.url || "",
  }));

  return (
    results
      .map(
        (r) => `Title: ${r.title}\nDescription: ${r.description}\nURL: ${r.url}`
      )
      .join("\n\n") || "No results found"
  );
}
