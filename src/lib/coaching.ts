import type { ArchetypeId, ChatMessage, GameId } from "@/types";
import { archetypes } from "@/data/archetypes";
import { translate, type Locale } from "@/i18n/translate";
export const starters = ["I'm avoiding something important.", "Help me take the first step.", "I can't stop overthinking.", "I feel guilty for procrastinating.", "Can you break this task down?"];
function englishGuidedReply(messages: Pick<ChatMessage, "role" | "content">[], archetype?: ArchetypeId): { content: string; game: GameId; mode: "guided" } {
  const last = [...messages].reverse().find(m => m.role === "user")?.content.toLowerCase() || "";
  const previous = messages.filter(m => m.role === "assistant").at(-1)?.content || "";
  if (/suicid|self.harm|kill myself|hurt myself|خودکشی|آسیب.*خود|خودم.*بکشم/.test(last)) return { content: "I’m glad you told me. You deserve real support right now. If you might hurt yourself, contact local emergency services or a crisis line (US/Canada: call or text 988). Can you reach someone you trust to stay with you?", game: "celebrate-wins", mode: "guided" };
  if (/guilt|guilty|shame|wasted|lazy|hate myself|گناه|شرم|تلف|تنبل|از خودم بدم/.test(last)) return { content: "A slow start doesn’t cancel the rest of your day. You don’t have to earn a fresh start. What is one small thing you did manage, even if it was just trying?", game: "celebrate-wins", mode: "guided" };
  if (/overthink|perfect|polish|good enough|judg|فکر کردن بیش|کمال|بی‌نقص|قضاوت|اصلاح|کافی خوب/.test(last)) return { content: "Let’s give this a finish line instead of an endless improvement loop. Name one thing that would make this useful, even if it isn’t perfect. What would ‘good enough’ look like?", game: "good-enough", mode: "guided" };
  if (/break|overwhelm|too much|too big|steps|portfolio|تقسیم|انبوه|زیادی بزرگ|قدم‌های کوچک|نمونه‌کار/.test(last)) return { content: "Let’s make this smaller: 1) Open the place where the work happens. 2) Write down one concrete next action. 3) Try that action for five minutes. You can customize these in Tiny Mission Builder. What goal are we shrinking?", game: "realistic-goals", mode: "guided" };
  if (/tired|exhaust|rest|خسته|استراحت/.test(last)) return { content: "Rest can be a real need, not a failure to try. Could you choose between a short break and one very small action, based on your energy right now?", game: "realistic-goals", mode: "guided" };
  if (/what.*(?:task|avoiding)|what.*shrinking|چه کاری را عقب|کدام هدف/i.test(previous) && messages.filter(m => m.role === "user").length > 1) return { content: "Thanks for naming it. Try this: open what you need, create one rough line or example, and stop after two minutes if you want. You can use The Messy Start to practice. What is the smallest visible action you could take?", game: "start-before-ready", mode: "guided" };
  if (/what.*(?:action|good enough|manage)|small thing|چه کار کوچکی|کافی خوب.*شکلی|کوچک‌ترین اقدام/i.test(previous)) return { content: "That gives you something concrete to work with. Keep it small enough for the energy you have, and let an attempt count. Would you like to try it now with a short challenge?", game: archetype ? archetypes[archetype].game : "start-before-ready", mode: "guided" };
  const context = archetype ? `Your ${archetypes[archetype].name.replace("The ", "").toLowerCase()} pattern suggests that a little less pressure may help. ` : "";
  return { content: `${context}You don’t need to solve the whole thing right now. Let’s find one tiny beginning. What’s the task you’re avoiding?`, game: archetype ? archetypes[archetype].game : "start-before-ready", mode: "guided" };
}
export function guidedReply(messages: Pick<ChatMessage, "role" | "content">[], archetype?: ArchetypeId, locale: Locale = "en") {
  const reply = englishGuidedReply(messages, archetype);
  return { ...reply, content: translate(reply.content, locale) };
}
