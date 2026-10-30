"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Send, Sparkles, Trash2 } from "lucide-react";
import { useApp, useResult } from "@/store/provider";
import { Modal } from "@/components/ui";
import { Mascot } from "@/components/mascot";
import { exercises } from "@/data/exercises";
import { guidedReply, starters } from "@/lib/coaching";
import { chatMessageSchema, type ChatMessage } from "@/types";
import { useLanguage } from "@/i18n/provider";
export function Companion() {
  const { profile, update, chatOpen, closeChat } = useApp(); const result = useResult(); const path = usePathname();
  const { locale, t } = useLanguage();
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [mode, setMode] = useState<"guided" | "live">("guided"); const [notice, setNotice] = useState("");
  const end = useRef<HTMLDivElement>(null); const pending = useRef(false); const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (chatOpen) void fetch("/api/chat").then(r => r.json()).then(d => setMode(d.mode === "live" ? "live" : "guided")).catch(() => {}); }, [chatOpen]);
  useEffect(() => { if (chatOpen) end.current?.scrollIntoView({ block: "nearest" }); }, [profile?.chat.length, busy, chatOpen]);
  const send = async (text: string) => {
    if (!profile || !text.trim() || pending.current) return;
    pending.current = true; setBusy(true); setInput(""); setNotice("");
    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text.trim().slice(0, 2000) };
    const messages = [...profile.chat, user].slice(-16);
    update(p => ({ ...p, chat: [...p.chat, user].slice(-98) }));
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })), archetype: result?.primary, context: path, locale }) });
      if (!response.ok) {
        if (response.status === 429) { setNotice("A little breather — please try again in a minute."); return; }
        throw new Error();
      }
      const raw = await response.json();
      const reply = chatMessageSchema.parse({ id: crypto.randomUUID(), role: "assistant", ...raw });
      setMode(reply.mode || "guided"); setNotice(typeof raw.notice === "string" ? raw.notice : "");
      update(p => ({ ...p, chat: [...p.chat, reply].slice(-100) }));
    } catch {
      const fallback = guidedReply(messages, result?.primary, locale);
      setMode("guided"); setNotice("Connection unavailable. This reply uses local guided support.");
      update(p => ({ ...p, chat: [...p.chat, { id: crypto.randomUUID(), role: "assistant" as const, ...fallback }].slice(-100) }));
    } finally { pending.current = false; setBusy(false); inputRef.current?.focus(); }
  };
  if (!chatOpen || !profile) return null;
  return <Modal title="ProcrastiBuddy" onClose={closeChat} className="chat-modal">
    <div className="chat-mode"><span className="online-dot" />{mode === "live" ? "Live AI companion" : "Guided support · thoughtfully written, not live AI"}</div>
    <div className="chat-history" role="log" aria-label="Conversation" aria-live="polite">
      {!profile.chat.length && <div className="chat-welcome"><Mascot id={result?.primary || "perfectionist"} /><h3>Hey, you. Let’s make it smaller.</h3><p>You don’t have to figure out everything. Just the next little thing.</p><div className="starter-prompts">{starters.map(s => <button key={s} onClick={() => send(t(s))}>{s}<ArrowRight size={13} /></button>)}</div></div>}
      {profile.chat.map(m => <div key={m.id} className={`chat-message ${m.role}`}><span className="chat-speaker">{m.role === "user" ? "You" : m.mode === "guided" ? "Buddy · guided support" : "Buddy · live AI"}</span><p translate={m.role === "user" || m.mode === "live" ? "no" : undefined} dir="auto">{m.content}</p>{m.role === "assistant" && m.game && <Link href={`/games/${m.game}`} onClick={closeChat} className="chat-game-link"><Sparkles size={13} />{exercises.find(e => e.id === m.game)?.name}<ArrowRight size={14} /></Link>}</div>)}
      {busy && <div className="typing" role="status" aria-label="Buddy is thinking"><span /><span /><span /></div>}<div ref={end} />
    </div>
    {notice && <p className="chat-notice" role="status">{notice}</p>}
    <form className="chat-form" onSubmit={e => { e.preventDefault(); void send(input); }}><label className="sr-only" htmlFor="chat-input">Message ProcrastiBuddy</label><input ref={inputRef} id="chat-input" maxLength={2000} value={input} placeholder="What’s on your mind?" onChange={e => setInput(e.target.value)} autoComplete="off" /><button className="send-button" type="submit" disabled={busy || !input.trim()} aria-label="Send message"><Send size={18} /></button></form>
    <div className="chat-bottom"><span>A companion for reflection, not mental health care.</span>{profile.chat.length > 0 && <button className="icon-button" aria-label="Clear conversation" disabled={busy} onClick={() => update(p => ({ ...p, chat: [] }))}><Trash2 size={13} /></button>}</div>
  </Modal>;
}
