import OpenAI from "openai";

/** Server-only provider selection shared by both AI endpoints. */
export function getAIConfig() {
  // Recognize a router key pasted into the older OPENAI_API_KEY field, too.
  const legacyRouterKey = process.env.OPENAI_API_KEY?.startsWith("sk-or-")
    ? process.env.OPENAI_API_KEY
    : undefined;
  const routerKey = process.env.OPENROUTER_API_KEY?.trim() || legacyRouterKey;
  if (routerKey) {
    return {
      provider: "openrouter" as const,
      apiKey: routerKey,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini",
    };
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    provider: "openai" as const,
    apiKey,
    baseURL: "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

export function createAIClient(config: NonNullable<ReturnType<typeof getAIConfig>>, timeout: number) {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout,
    maxRetries: 1,
    ...(config.provider === "openrouter"
      ? { defaultHeaders: { "X-Title": "ProcrastiNot" } }
      : {}),
  });
}
