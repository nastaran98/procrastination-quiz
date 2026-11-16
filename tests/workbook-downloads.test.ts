// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, HEAD } from "@/app/api/workbooks/[archetype]/route";
import { GET as stats } from "@/app/api/stats/route";
import { workbookFiles } from "@/data/workbooks";

const database = vi.hoisted(() => ({ current: null as unknown }));
const files = vi.hoisted(() => ({ readFile: vi.fn(), stat: vi.fn() }));
vi.mock("@/lib/server/db", () => ({ getDb: () => database.current }));
vi.mock("node:fs/promises", () => files);

const request = () => new Request("http://localhost/api/workbooks/perfectionist");
const context = (archetype = "perfectionist") => ({ params: Promise.resolve({ archetype }) });
const pdf = Buffer.from("%PDF-1.7\nworkbook");

beforeEach(() => {
  database.current = null;
  files.readFile.mockReset().mockResolvedValue(pdf);
  files.stat.mockReset().mockResolvedValue({ size: pdf.length });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("tracked workbook downloads", () => {
  it("serves the matching PDF as an uncached attachment and records every request", async () => {
    const create = vi.fn().mockResolvedValue({});
    database.current = { workbookDownload: { create } };
    for (let i = 0; i < 2; i++) {
      const response = await GET(request(), context());
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/pdf");
      expect(response.headers.get("content-disposition")).toBe('attachment; filename="The Perfectionist - Workbook.pdf"');
      expect(response.headers.get("content-length")).toBe(String(pdf.length));
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("x-workbook-tracking")).toBe("recorded");
      expect(Buffer.from(await response.arrayBuffer())).toEqual(pdf);
    }
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenCalledWith({ data: { archetypeId: "perfectionist", fileName: "The Perfectionist.pdf" } });
  });

  it("resolves all twelve files from the server-controlled mapping", async () => {
    for (const [id, fileName] of Object.entries(workbookFiles)) {
      expect((await GET(request(), context(id))).status).toBe(200);
      expect(files.readFile).toHaveBeenLastCalledWith(expect.stringContaining(`/public/solutions/${fileName}`));
    }
  });

  it("rejects unknown IDs and path traversal before reading files or recording events", async () => {
    const create = vi.fn();
    database.current = { workbookDownload: { create } };
    for (const id of ["unknown", "__proto__", "../.env", "The Perfectionist.pdf"]) {
      expect((await GET(request(), context(id))).status).toBe(404);
    }
    expect(files.readFile).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not count missing files", async () => {
    const create = vi.fn();
    database.current = { workbookDownload: { create } };
    files.readFile.mockRejectedValue(new Error("ENOENT"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await GET(request(), context())).status).toBe(503);
    expect(create).not.toHaveBeenCalled();
  });

  it("allows downloads with tracking disabled or a database outage", async () => {
    const disabled = await GET(request(), context());
    expect(disabled.status).toBe(200);
    expect(disabled.headers.get("x-workbook-tracking")).toBe("disabled");
    database.current = { workbookDownload: { create: vi.fn().mockRejectedValue(new Error("Offline")) } };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const unavailable = await GET(request(), context());
    expect(unavailable.status).toBe(200);
    expect(unavailable.headers.get("x-workbook-tracking")).toBe("unavailable");
    expect(await unavailable.text()).toBe(pdf.toString());
  });

  it("serves HEAD metadata without recording a download", async () => {
    const create = vi.fn();
    database.current = { workbookDownload: { create } };
    const response = await HEAD(request(), context());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe(String(pdf.length));
    expect(response.headers.get("x-workbook-tracking")).toBe("not-counted");
    expect(await response.text()).toBe("");
    expect(files.readFile).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});

describe("private workbook analytics", () => {
  it("includes totals, recent requests, and zero-count workbooks behind the existing secret", async () => {
    vi.stubEnv("ANALYTICS_SECRET", "private-workbook-test-secret");
    const count = vi.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    database.current = {
      visitor: { count: vi.fn().mockResolvedValue(1) },
      assessment: { count: vi.fn().mockResolvedValue(1), groupBy: vi.fn().mockResolvedValue([]) },
      workbookDownload: { count, groupBy: vi.fn().mockResolvedValue([{ archetypeId: "perfectionist", _count: { _all: 5 } }]) },
    };
    expect((await stats(new Request("http://localhost/api/stats"))).status).toBe(401);
    expect(count).not.toHaveBeenCalled();
    const response = await stats(new Request("http://localhost/api/stats", { headers: { Authorization: "Bearer private-workbook-test-secret" } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const { workbookDownloads } = await response.json();
    expect(workbookDownloads).toMatchObject({ total: 5, last7Days: 2 });
    expect(workbookDownloads.byWorkbook).toHaveLength(12);
    expect(workbookDownloads.byWorkbook[0]).toMatchObject({ archetypeId: "perfectionist", fileName: "The Perfectionist.pdf", downloads: 5 });
    expect(workbookDownloads.byWorkbook[1]).toMatchObject({ archetypeId: "approval_seeker", downloads: 0 });
    expect(count).toHaveBeenLastCalledWith({ where: { createdAt: { gte: expect.any(Date) } } });
  });
});
