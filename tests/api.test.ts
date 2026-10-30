// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as recordUsage } from "@/app/api/usage/route";
import { POST as recordResult } from "@/app/api/results/route";
import { POST as chat, GET as chatMode } from "@/app/api/chat/route";
import { GET as stats } from "@/app/api/stats/route";
import { POST as suggestSteps } from "@/app/api/steps/route";
import { clearAnswers, mixedAnswers } from "./fixtures";
const database = vi.hoisted(() => ({ current: null as unknown }));
const sdk = vi.hoisted(() => ({ create: vi.fn(), options: [] as unknown[] }));
vi.mock("openai", () => ({ default: class {
  chat = { completions: { create: sdk.create } };
  constructor(options: unknown) { sdk.options.push(options); }
} }));
vi.mock("@/lib/server/db", () => ({ getDb: () => database.current }));
const visitorId = "492d54bd-58d1-4a29-9fa3-c213c06992ae";
const sessionId = "8e50723a-c4be-4259-812e-244170f44d09";
const demographics = { age: 28, sex: "female" };
const email = "quiz@example.com";
function request(path: string, data: unknown, origin = "http://localhost:3000") { return new Request(`http://localhost:3000/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, "X-Forwarded-For": crypto.randomUUID() }, body: JSON.stringify(data) }); }
beforeEach(() => { database.current = null; sdk.create.mockReset(); sdk.options.length = 0; vi.stubEnv("OPENAI_API_KEY", ""); vi.stubEnv("OPENROUTER_API_KEY", ""); vi.stubEnv("OPENROUTER_MODEL", ""); });
afterEach(() => { vi.unstubAllEnvs(); });
describe("optional server integrations", () => {
  it("works without a configured database", async () => { expect(await (await recordUsage(request("usage", { visitorId }))).json()).toEqual({ enabled: false }); expect(await (await recordResult(request("results", { visitorId, sessionId, email, demographics, answers: clearAnswers, followUps: [] }))).json()).toEqual({ enabled: false }); });
  it("upserts visitors by the same anonymous ID", async () => { const upsert = vi.fn(); database.current = { visitor: { upsert } }; await recordUsage(request("usage", { visitorId })); await recordUsage(request("usage", { visitorId })); expect(upsert).toHaveBeenCalledTimes(2); expect(upsert.mock.calls.every(([arg]) => arg.where.id === visitorId && arg.create.id === visitorId)).toBe(true); });
  it("recalculates scores and uses duplicate-safe, ordered result writes", async () => {
    const tx = { visitor: { upsert: vi.fn() }, assessment: { createMany: vi.fn(), updateMany: vi.fn() } };
    database.current = { $transaction: async (fn: (t: typeof tx) => Promise<void>) => fn(tx) };
    const response = await recordResult(request("results", { visitorId, sessionId, email: ` ${email} `, demographics, answers: clearAnswers, followUps: [], primary: "dreamer" }));
    expect(response.status).toBe(200);
    expect(tx.assessment.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true, data: [expect.objectContaining({ id: sessionId, visitorId, email, age: 28, sex: "female", answers: clearAnswers, primary: "perfectionist", status: "clear" })] }));
    expect(tx.assessment.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: sessionId, visitorId, followUpCount: { lte: 0 } } }));
  });
  it("rejects incomplete answers and invalid adaptive comparisons", async () => {
    expect((await recordResult(request("results", { visitorId, sessionId, email, demographics, answers: clearAnswers.slice(0, 9), followUps: [] }))).status).toBe(400);
    expect((await recordResult(request("results", { visitorId, sessionId, email, demographics, answers: mixedAnswers, followUps: [{ a: "dreamer", b: "defier", choice: "a", kind: "blocker" }] }))).status).toBe(400);
  });
  it("requires a valid age and sex before recording a result", async () => {
    for (const value of [undefined, { age: 0, sex: "female" }, { age: 28.5, sex: "male" }, { age: 121, sex: "male" }, { age: 28, sex: "unknown" }]) {
      expect((await recordResult(request("results", { visitorId, sessionId, email, demographics: value, answers: clearAnswers, followUps: [] }))).status).toBe(400);
    }
  });
  it("rejects missing, malformed, and oversized emails", async () => {
    for (const value of [undefined, "", "not-an-email", "person@", "person@example", `${"a".repeat(243)}@example.com`]) {
      expect((await recordResult(request("results", { visitorId, sessionId, email: value, demographics, answers: clearAnswers, followUps: [] }))).status).toBe(400);
    }
  });
  it("rejects cross-origin writes and oversized payloads", async () => {
    expect((await recordUsage(request("usage", { visitorId }, "https://unrelated.example"))).status).toBe(403);
    expect((await recordUsage(request("usage", { visitorId, extra: "x".repeat(2000) }))).status).toBe(400);
  });
  it("requires the private token to view usage counts", async () => { vi.stubEnv("ANALYTICS_SECRET", "a-private-test-secret"); expect((await stats(new Request("http://localhost/api/stats"))).status).toBe(401); expect(await (await stats(new Request("http://localhost/api/stats", { headers: { Authorization: "Bearer a-private-test-secret" } }))).json()).toMatchObject({ enabled: false }); });
  it("offers honestly labeled, helpful guided coaching without a key", async () => {
    expect(await (await chatMode()).json()).toEqual({ mode: "guided" });
    const response = await chat(request("chat", { messages: [{ role: "user", content: "I feel guilty for procrastinating." }] }));
    expect(await response.json()).toMatchObject({ mode: "guided", game: "celebrate-wins" });
  });
  it("rejects empty chat and assistant-only requests", async () => { expect((await chat(request("chat", { messages: [] }))).status).toBe(400); expect((await chat(request("chat", { messages: [{ role: "assistant", content: "hello" }] }))).status).toBe(400); });
  it("sends live chat through OpenRouter with the configured model", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-only"); vi.stubEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini");
    sdk.create.mockResolvedValue({ choices: [{ message: { content: "What tiny first step would help?" } }] });
    expect(await (await chatMode()).json()).toEqual({ mode: "live" });
    const response = await chat(request("chat", { messages: [{ role: "user", content: "Help me begin." }] }));
    expect(await response.json()).toMatchObject({ mode: "live", content: "What tiny first step would help?" });
    expect(sdk.options[0]).toMatchObject({ baseURL: "https://openrouter.ai/api/v1", apiKey: "sk-or-test-only" });
    expect(sdk.create).toHaveBeenCalledWith(expect.objectContaining({ model: "openai/gpt-4o-mini", max_tokens: 350 }));
  });
  it("uses the same OpenRouter configuration for mission suggestions", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-only");
    sdk.create.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ steps: ["Open my portfolio", "Choose one project", "Write a rough sentence"] }) } }] });
    const response = await suggestSteps(request("steps", { goal: "Build my portfolio", minutes: 5 }));
    expect(await response.json()).toMatchObject({ mode: "live", steps: ["Open my portfolio", "Choose one project", "Write a rough sentence"] });
    expect(sdk.options[0]).toMatchObject({ baseURL: "https://openrouter.ai/api/v1" });
  });
  it("falls back honestly if OpenRouter is unavailable", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test-only"); sdk.create.mockRejectedValue(new Error("Provider unavailable"));
    const response = await chat(request("chat", { messages: [{ role: "user", content: "Help me begin." }] }));
    expect(await response.json()).toMatchObject({ mode: "guided", notice: "Live AI is taking a breather. This reply uses guided support." });
  });
  it("honors Persian locale in both guided API endpoints", async () => {
    const response = await chat(request("chat", { messages: [{ role: "user", content: "از تعلل احساس گناه می‌کنم" }], locale: "fa" }));
    expect(await response.json()).toMatchObject({ mode: "guided", game: "celebrate-wins", content: expect.stringContaining("یک شروع کند") });
    const suggestions = await suggestSteps(request("steps", { goal: "نوشتن مقاله", minutes: 5, locale: "fa" }));
    expect(await suggestions.json()).toMatchObject({ mode: "guided", steps: expect.arrayContaining([expect.stringContaining("فایل")]) });
  });
});
