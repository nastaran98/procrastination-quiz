// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAIClient, getAIConfig } from "@/lib/server/ai";
import { databaseUrls } from "@/lib/server/database-config";

beforeEach(() => {
  for (const name of ["OPENROUTER_API_KEY", "OPENROUTER_MODEL", "OPENAI_API_KEY", "OPENAI_MODEL"]) vi.stubEnv(name, "");
});
afterEach(() => vi.unstubAllEnvs());

describe("server AI configuration", () => {
  it("uses guided support when no provider key exists", () => expect(getAIConfig()).toBeNull());
  it("uses OpenRouter without an OpenAI key", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-only");
    const config = getAIConfig()!;
    expect(config).toMatchObject({ provider: "openrouter", model: "openai/gpt-4o-mini", baseURL: "https://openrouter.ai/api/v1" });
    expect(createAIClient(config, 20000).baseURL).toBe("https://openrouter.ai/api/v1");
  });
  it("honors an explicitly selected OpenRouter model and prefers its key", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-only"); vi.stubEnv("OPENAI_API_KEY", "sk-test-only");
    vi.stubEnv("OPENROUTER_MODEL", "anthropic/claude-sonnet-4");
    expect(getAIConfig()).toMatchObject({ provider: "openrouter", model: "anthropic/claude-sonnet-4" });
  });
  it("recognizes a router key in the older OpenAI variable", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-or-test-only");
    expect(getAIConfig()?.provider).toBe("openrouter");
  });
  it("retains optional direct OpenAI access", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-only");
    expect(getAIConfig()).toMatchObject({ provider: "openai", baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini" });
  });
});

describe("direct-only and pooled database configuration", () => {
  it("disables recording only when both URLs are missing", () => {
    expect(databaseUrls({})).toBeNull(); expect(databaseUrls({ DATABASE_URL: "", DIRECT_URL: "" })).toBeNull();
  });
  it("uses a direct URL alone for both app and migration connections", () => {
    const direct = "postgresql://test:fake@ep-test.us-east-2.aws.neon.tech/neondb?sslmode=require";
    expect(databaseUrls({ DATABASE_URL: "", DIRECT_URL: direct })).toEqual({ runtime: direct, direct });
  });
  it("derives a non-pooled Neon endpoint without changing credentials or query options", () => {
    const pool = "postgresql://test:fake@ep-test-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    expect(databaseUrls({ DIRECT_URL: pool })).toEqual({ runtime: pool, direct: pool.replace("ep-test-pooler.", "ep-test.") });
  });
  it("prefers the pooled runtime URL when both are provided", () => {
    expect(databaseUrls({ DATABASE_URL: "postgresql://test:fake@pool.example/db", DIRECT_URL: "postgresql://test:fake@direct.example/db" })).toEqual({ runtime: "postgresql://test:fake@pool.example/db", direct: "postgresql://test:fake@direct.example/db" });
  });
});
