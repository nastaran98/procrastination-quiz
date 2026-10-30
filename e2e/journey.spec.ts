import { expect, test } from "@playwright/test";
import { questions } from "../src/data/questions";
import { clearAnswers, mixedAnswers } from "../tests/fixtures";
import { mascotAssets } from "../src/data/mascot-assets";

async function beginQuiz(page: import("@playwright/test").Page) {
  await page.getByLabel("Age", { exact: true }).fill("28");
  await page.getByLabel("Sex", { exact: true }).selectOption("female");
  await page.getByLabel("Email address", { exact: true }).fill("quiz@example.com");
  await page.getByRole("button", { name: "Let’s Go!" }).click();
}

test("all twelve uploaded mascots load in the character explorer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page.locator(".character-grid .character-card");
  await expect(cards).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Meet all 12 characters" })).toHaveCount(0);
  await expect(cards.locator(".character-symptoms")).toHaveCount(0);
  await expect(cards.getByText("Click to view symptoms")).toHaveCount(12);
  for (const [index, filename] of Object.values(mascotAssets).entries()) {
    const image = cards.nth(index).locator(".mascot img");
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect(image).toHaveJSProperty("complete", true);
    expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth), filename).toBeGreaterThan(0);
    await expect(image).toHaveAttribute("src", new RegExp(encodeURIComponent(encodeURIComponent(filename))));
  }
});

test("landing → demographics → ten questions → saved result → refresh → retake", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Discover My Archetype" }).click();
  await page.getByRole("button", { name: "Let’s Go!" }).click();
  await expect(page.getByRole("heading", { name: "Before we begin" })).toBeVisible();
  await page.getByLabel("Age", { exact: true }).fill("28");
  await page.getByLabel("Sex", { exact: true }).selectOption("female");
  await page.getByRole("button", { name: "Let’s Go!" }).click();
  await expect(page.getByRole("heading", { name: "Before we begin" })).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("person@example");
  await page.getByRole("button", { name: "Let’s Go!" }).click();
  await expect(page.locator(".demographics-form").getByRole("alert")).toHaveText("Please enter a valid age, sex, and email address.");
  await beginQuiz(page);
  const recording = page.waitForRequest(request => request.url().endsWith("/api/results") && request.method() === "POST");
  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole("heading", { name: questions[i].text })).toBeVisible();
    const answer = questions[i].options.find(o => o.archetype === clearAnswers[i].primary)!;
    await page.getByRole("button", { name: answer.text, exact: false }).click();
    if (i === 2) {
      const order = await page.locator(".answer-card").allTextContents();
      await page.reload(); await expect(page.getByRole("heading", { name: questions[i].text })).toBeVisible();
      expect(await page.locator(".answer-card").allTextContents()).toEqual(order);
    }
    await page.getByRole("button", { name: i === 9 ? "Meet My Pattern" : "Continue", exact: false }).click();
  }
  await expect(page).toHaveURL("/results");
  await expect(page.getByRole("heading", { name: "Meet The Perfectionist!" })).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  expect((await recording).postDataJSON()).toMatchObject({ email: "quiz@example.com", demographics: { age: 28, sex: "female" }, answers: clearAnswers });
  await expect(page.getByText("Solutions will be released in future versions :)" )).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("procrastinot:profile:v1")!).quiz);
  expect(saved.demographics).toEqual({ age: 28, sex: "female" });
  expect(saved.email).toBe("quiz@example.com");
  expect(saved.answers).toHaveLength(10);
  expect(saved.result).toMatchObject({ primary: "perfectionist", status: "clear" });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Meet The Perfectionist!" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Meet My AI Buddy" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start My First Challenge" })).toHaveCount(0);
  await page.getByRole("button", { name: "Retake Quiz" }).click();
  await expect(page.getByRole("button", { name: "Let’s Go!" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("procrastinot:profile:v1")!).quiz.answers)).toEqual([]);
});

test("mixed results offer a symptom comparison without solution suggestions", async ({ page }) => {
  await page.goto("/quiz"); await beginQuiz(page);
  for (let i = 0; i < 10; i++) {
    const q = questions[i], a = mixedAnswers[i];
    await page.getByRole("button", { name: q.options.find(o => o.archetype === a.primary)!.text, exact: false }).click();
    if (a.secondary) await page.getByRole("button", { name: q.options.find(o => o.archetype === a.secondary)!.text, exact: false }).click();
    await page.getByRole("button", { name: i === 9 ? "Meet My Pattern" : "Continue", exact: false }).click();
  }
  await expect(page.getByRole("heading", { name: "Meet your mixed profile." })).toBeVisible();
  await page.getByRole("button", { name: "Explore a little more" }).click();
  await page.getByRole("button", { name: "Both feel familiar" }).click();
  await expect(page.getByRole("button", { name: "Explore a little more" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Meet your mixed profile." })).toBeVisible();
});

test("chatbot and solutions are absent, including old solution URLs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open ProcrastiBuddy" })).toHaveCount(0);
  await page.locator(".character-card").first().click();
  await expect(page.getByRole("dialog")).toContainText("Common symptoms");
  await expect(page.getByRole("dialog")).not.toContainText("A little thing to try");
  for (const route of ["/games", "/games/celebrate-wins", "/games/start-before-ready", "/games/good-enough", "/games/realistic-goals", "/dashboard"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "More to come" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open ProcrastiBuddy" })).toHaveCount(0);
  }
});

test("ordered choices cap at two, have distinct colors, promote on removal and survive refresh", async ({ page }) => {
  await page.goto("/quiz"); await beginQuiz(page);
  const cards = page.locator(".answer-card");
  const next = page.getByRole("button", { name: "Continue", exact: false });
  await expect(next).toBeDisabled();
  await cards.nth(0).click();
  await expect(cards.nth(0)).toContainText("1 · Very similar");
  await cards.nth(1).click();
  await expect(cards.nth(1)).toContainText("2 · Similar");
  expect(await cards.nth(0).evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(await cards.nth(1).evaluate(e => getComputedStyle(e).backgroundColor));
  await expect(cards.nth(2)).toBeDisabled();
  await cards.nth(0).click();
  await expect(cards.nth(1)).toContainText("1 · Very similar");
  await cards.nth(1).click();
  await page.reload();
  await expect(next).toBeDisabled();
  await cards.nth(2).click(); await cards.nth(3).click();
  await page.reload();
  await expect(cards.nth(2)).toContainText("1 · Very similar");
  await expect(cards.nth(3)).toContainText("2 · Similar");
  await page.getByRole("button", { name: "None of these feel like me" }).click();
  await expect(page.locator(".answer-card[aria-pressed=true]")).toHaveCount(0);
  await next.click();
  await page.getByRole("button", { name: "Skip question" }).click();
  const answers = await page.evaluate(() => JSON.parse(localStorage.getItem("procrastinot:profile:v1")!).quiz.answers);
  expect(answers).toEqual([{ questionId: 1, none: true }, { questionId: 2, skipped: true }]);
});

test("all important pages fit every target viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Reset my data" }).click();
    await page.getByRole("button", { name: "Clear local data" }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("procrastinot:profile:v1")!).quiz)).toBeNull();
    for (const route of ["/", "/quiz", "/results", "/dashboard", "/games", "/games/celebrate-wins", "/games/start-before-ready", "/games/good-enough", "/games/realistic-goals"]) {
      await page.goto(route); await expect(page.locator("h1").first()).toBeVisible();
      const overflow = await page.evaluate(() => ({ overflowing: document.documentElement.scrollWidth > window.innerWidth, elements: [...document.querySelectorAll("body *")].filter(e => { const rect = e.getBoundingClientRect(); return rect.right > window.innerWidth + 1 && rect.width > 0; }).map(e => `${e.tagName}.${e.className}`).slice(0, 15) }));
      expect(overflow.overflowing, `${route} overflows at ${width}px: ${overflow.elements.join(", ")}`).toBe(false);
      if (route === "/" && width < 768) {
        const cards = await page.locator(".character-card").evaluateAll(elements => elements.map(element => { const { x, top, bottom } = element.getBoundingClientRect(); return { x, top, bottom }; }));
        expect(cards).toHaveLength(12);
        for (let i = 1; i < cards.length; i++) {
          expect(cards[i].x).toBeCloseTo(cards[0].x);
          expect(cards[i].top).toBeGreaterThanOrEqual(cards[i - 1].bottom);
        }
      }
    }
    await page.goto("/quiz"); await beginQuiz(page);
    await expect(page.getByRole("heading", { name: questions[0].text })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `active quiz at ${width}px`).toBe(true);
    await page.evaluate(answers => { const p = JSON.parse(localStorage.getItem("procrastinot:profile:v1")!); p.quiz.answers = answers; p.quiz.finished = true; localStorage.setItem("procrastinot:profile:v1", JSON.stringify(p)); }, clearAnswers);
    await page.goto("/results"); await expect(page.getByRole("heading", { name: "Meet The Perfectionist!" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `revealed result at ${width}px`).toBe(true);
    if (width === 375 || width === 1440) {
      await page.screenshot({ path: test.info().outputPath(`results-${width}.png`), fullPage: true, animations: "disabled" });
      await page.goto("/"); await page.screenshot({ path: test.info().outputPath(`landing-${width}.png`), fullPage: true, animations: "disabled" });
    }
  }
});
