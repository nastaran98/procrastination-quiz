import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { clearAnswers } from "../tests/fixtures";
test("core screens meet automated WCAG AA checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/quiz", "/dashboard", "/games", "/games/celebrate-wins", "/games/start-before-ready", "/games/good-enough", "/games/realistic-goals"]) {
    await page.goto(route); await expect(page.locator("h1").first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect.soft(results.violations.map(v => ({ id: v.id, elements: v.nodes.map(n => ({ selector: n.target, failure: n.failureSummary })) })), route).toEqual([]);
  }
  await page.goto("/quiz");
  await page.getByLabel("Age", { exact: true }).fill("28");
  await page.getByLabel("Sex", { exact: true }).selectOption("female");
  await page.getByLabel("Email address", { exact: true }).fill("quiz@example.com");
  await page.getByRole("button", { name: "Let’s Go!" }).click();
  await page.locator(".answer-card").nth(0).click();
  await page.locator(".answer-card").nth(1).click();
  const quizCheck = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect.soft(quizCheck.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, failure: n.failureSummary })) })), "active quiz").toEqual([]);
  await page.evaluate(answers => { const p = JSON.parse(localStorage.getItem("procrastinot:profile:v1")!); p.quiz.answers = answers; p.quiz.finished = true; localStorage.setItem("procrastinot:profile:v1", JSON.stringify(p)); }, clearAnswers);
  await page.goto("/results"); await expect(page.getByRole("heading", { name: "Meet The Perfectionist!" })).toBeVisible();
  const resultCheck = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect.soft(resultCheck.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, failure: n.failureSummary })) })), "result reveal").toEqual([]);
  await expect(page.locator(".buddy-launcher")).toHaveCount(0);
});
