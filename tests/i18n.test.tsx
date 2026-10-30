import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/i18n/en.json";
import fa from "@/i18n/fa.json";
import { translate, localeNumber } from "@/i18n/translate";
import { LanguageProvider, Localized } from "@/i18n/provider";
import { questions } from "@/data/questions";
import { archetypeList } from "@/data/archetypes";
import { exercises } from "@/data/exercises";
import { guidedReply } from "@/lib/coaching";

afterEach(() => { document.documentElement.dir = "ltr"; document.documentElement.lang = "en"; document.cookie = "procrastinot-locale=; Max-Age=0; Path=/"; });
describe("English / Persian localization", () => {
  it("keeps both catalogs complete and in sync", () => {
    expect(Object.keys(fa).sort()).toEqual(Object.keys(en).sort());
    expect(Object.values(fa).every(value => value.trim().length > 0)).toBe(true);
  });
  it("translates every quiz question and response without changing stable IDs", () => {
    for (const question of questions) {
      expect(translate(question.text, "fa"), question.text).not.toBe(question.text);
      for (const option of question.options) expect(translate(option.text, "fa"), option.text).not.toBe(option.text);
    }
  });
  it("covers all archetype descriptions, blockers, strategies, and adaptive text", () => {
    for (const a of archetypeList) for (const text of [a.name, a.description, a.rootCause, a.thought, a.helpful, ...a.symptoms, ...a.strategies]) expect(translate(text, "fa"), text).not.toBe(text);
    for (const exercise of exercises) for (const text of [exercise.name, exercise.label, exercise.description, exercise.time]) expect(translate(text, "fa"), text).not.toBe(text);
  });
  it("handles dynamic result titles, Persian numerals, and safe URL interpolation", () => {
    expect(translate("Meet The Perfectionist!", "fa")).toBe("با کمال‌گرا آشنا شو!");
    expect(localeNumber(25, "fa")).toBe("۲۵");
    expect(translate("share.link", "fa", { url: "http://localhost:3001" })).toContain("http://localhost:3001");
    expect(translate("Continue", "en")).toBe("Continue");
  });
  it("renders RTL copy and accessible labels while preserving user content and handlers", () => {
    const click = vi.fn();
    render(<LanguageProvider initialLocale="fa"><Localized><button onClick={click}>Continue</button><input aria-label="My little win" placeholder="I opened my laptop and wrote one sentence…" /><p translate="no">Continue</p></Localized></LanguageProvider>);
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(document.documentElement).toHaveAttribute("lang", "fa");
    fireEvent.click(screen.getByRole("button", { name: "ادامه" })); expect(click).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("موفقیت کوچک من")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("Continue")).toHaveAttribute("translate", "no");
  });
  it("recognizes Persian coaching scenarios and replies in Persian", () => {
    const reply = guidedReply([{ role: "user", content: fa.starter4 }], undefined, "fa");
    expect(reply.game).toBe("celebrate-wins"); expect(reply.content).toBe(fa["coach.guilt"]);
    expect(guidedReply([{ role: "user", content: "سلام" }], "perfectionist", "fa").content).toContain("کمال‌گرا");
  });
});
