import { test, expect } from "@playwright/test";
import { translate } from "../src/i18n/translate";
import { questions } from "../src/data/questions";
import { clearAnswers } from "../tests/fixtures";
import AxeBuilder from "@axe-core/playwright";

test("Persian selection persists through demographics, ranked answers, and saved results", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Language" }).selectOption("fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("چرا مدام");
  await expect(page.locator(".character-card")).toHaveCount(12);
  await expect(page.locator(".character-card .character-symptoms")).toHaveCount(0);
  await expect(page.locator(".character-card").getByText("برای دیدن نشانه‌ها کلیک کن")).toHaveCount(12);
  await page.reload(); await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("link", { name: "الگوی من را پیدا کن" }).click();
  await page.getByLabel("سن", { exact: true }).fill("32");
  await page.getByLabel("جنسیت", { exact: true }).selectOption("male");
  await page.getByLabel("آدرس ایمیل", { exact: true }).fill("persian@example.com");
  await expect(page.getByLabel("آدرس ایمیل", { exact: true })).toHaveAttribute("dir", "ltr");
  await page.getByRole("button", { name: "بزن بریم!" }).click();
  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole("heading", { name: translate(questions[i].text, "fa") })).toBeVisible();
    const option = questions[i].options.find(o => o.archetype === clearAnswers[i].primary)!;
    await page.getByRole("button", { name: translate(option.text, "fa"), exact: false }).click();
    await expect(page.locator(".answer-card[aria-pressed=true]")).toContainText("۱ · خیلی شبیه من");
    if (i === 2) {
      await page.locator(".language-select select").selectOption("en");
      await expect(page.getByRole("heading", { name: questions[i].text })).toBeVisible();
      await expect(page.locator(".answer-card[aria-pressed=true]")).toHaveCount(1);
      await page.locator(".language-select select").selectOption("fa");
    }
    await page.getByRole("button", { name: i === 9 ? "الگوی من را نشان بده" : "ادامه", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "با کمال‌گرا آشنا شو!" })).toBeVisible();
  await expect(page.getByText("راهکارها در نسخه‌های آینده منتشر می‌شوند :)" )).toBeVisible();
  await expect(page.locator(".buddy-launcher")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "با کمال‌گرا آشنا شو!" })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("procrastinot:profile:v1")!).quiz);
  expect(saved.demographics).toEqual({ age: 32, sex: "male" });
  expect(saved.email).toBe("persian@example.com");
  expect(saved.answers).toHaveLength(10);
  expect(saved.result.primary).toBe("perfectionist");
  await page.locator(".language-select select").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Meet The Perfectionist!" })).toBeVisible();
});

test("Persian pages are server-rendered, accessible, and fit all target widths", async ({ page, context }) => {
  await context.addCookies([{ name: "procrastinot-locale", value: "fa", url: "http://127.0.0.1:3100" }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/");
  expect(await response!.text()).toContain('dir="rtl"');
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/quiz", "/results", "/dashboard", "/games", "/games/celebrate-wins", "/games/start-before-ready", "/games/good-enough", "/games/realistic-goals"]) {
      await page.goto(route); await expect(page.locator("h1").first()).toBeVisible();
      const layout = await page.evaluate(() => ({ fits: document.documentElement.scrollWidth <= innerWidth, overflow: [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1); }).map(e => `${e.tagName}.${e.className}`).slice(0, 12) }));
      expect(layout.fits, `${route} at ${width}px in Persian: ${layout.overflow.join(", ")}`).toBe(true);
      if (route === "/" && width < 768) {
        const cards = await page.locator(".character-card").evaluateAll(elements => elements.map(element => { const { x, top, bottom } = element.getBoundingClientRect(); return { x, top, bottom }; }));
        expect(cards).toHaveLength(12);
        for (let i = 1; i < cards.length; i++) {
          expect(cards[i].x).toBeCloseTo(cards[0].x);
          expect(cards[i].top).toBeGreaterThanOrEqual(cards[i - 1].bottom);
        }
      }
    }
    await page.goto("/quiz"); await expect(page.locator("h1")).toBeVisible();
    const begin = page.getByRole("button", { name: "بزن بریم!" });
    if (await begin.isVisible()) {
      await page.getByLabel("سن", { exact: true }).fill("32");
      await page.getByLabel("جنسیت", { exact: true }).selectOption("male");
      await page.getByLabel("آدرس ایمیل", { exact: true }).fill("persian@example.com");
      await begin.click();
    }
    await expect(page.getByRole("heading", { name: translate(questions[0].text, "fa") })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `active Persian quiz at ${width}px`).toBe(true);
  }
  const quiz = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(quiz.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.evaluate(answers => { const p = JSON.parse(localStorage.getItem("procrastinot:profile:v1")!); p.quiz.answers = answers; p.quiz.finished = true; localStorage.setItem("procrastinot:profile:v1", JSON.stringify(p)); }, clearAnswers);
  await page.goto("/results"); await expect(page.getByRole("heading", { name: "با کمال‌گرا آشنا شو!" })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("persian-result-mobile.png"), fullPage: true });
  await page.goto("/"); await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: test.info().outputPath("persian-landing-desktop.png"), fullPage: true });
});
