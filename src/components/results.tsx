"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart, Instagram, RotateCcw, Send, Share2, Sparkles } from "lucide-react";
import { useApp, useResult } from "@/store/provider";
import { Mascot } from "@/components/mascot";
import { Loading, Progress, Reveal } from "@/components/ui";
import { archetypes } from "@/data/archetypes";
import { scoreQuiz } from "@/lib/archetypes/scoring";
import { questions } from "@/data/questions";
import { nextFollowUp } from "@/lib/archetypes/follow-ups";
import type { AdaptiveFollowUp } from "@/types";
import { Localized, useLanguage } from "@/i18n/provider";
export function Results() {
  const { profile, retake, update } = useApp(); const result = useResult(); const router = useRouter();
  const { t, locale } = useLanguage();
  const [revealing, setRevealing] = useState(true); const [follow, setFollow] = useState(false); const [shareNotice, setShareNotice] = useState("");
  useEffect(() => { const t = setTimeout(() => setRevealing(false), 1000); return () => clearTimeout(t); }, []);
  if (!profile) return <Loading />;
  if (!result) return <Localized><section className="narrow page-section center"><Mascot id="dreamer" className="intro-mascot" /><h1>Your story starts here.</h1><p>Take a little time to discover what’s behind your “later.”</p><Link className="button" href="/quiz">{profile.quiz?.started ? "Continue My Quiz" : "Discover My Archetype"} <ArrowRight size={16} /></Link></section></Localized>;
  if (revealing) return <Localized><section className="result-connecting" role="status"><Mascot float /><Sparkles className="pulse" /><h1>Connecting the dots…</h1><p>A little understanding is on its way.</p></section></Localized>;
  const restart = () => { retake(); router.push("/quiz"); };
  if (result.status === "insufficient") return <Localized><section className="narrow page-section center"><Mascot id="dreamer" className="intro-mascot" /><span className="eyebrow">YOU’RE MORE THAN A QUIZ</span><h1>A little more room<br />for discovery.</h1><p>Your answers don’t point to a strong enough pattern yet, and that’s completely okay. We won’t squeeze you into a character.</p><div className="info-card"><h3>What your answers tell us</h3><p>You answered {result.completed} of 10 questions{result.noneCount ? `, with ${result.noneCount} “None of these” ${result.noneCount === 1 ? "response" : "responses"}` : ""}. These patterns might not describe what’s happening for you right now.</p></div><SolutionUpdates /><div className="button-row centered"><Link href="/#characters" className="button">Explore Other Archetypes <ArrowRight size={16} /></Link><button className="button secondary" onClick={restart}>Try the quiz again</button></div></section></Localized>;
  const a = archetypes[result.primary!]; const runner = result.secondary ? archetypes[result.secondary] : null;
  const nextComparison = nextFollowUp(result, profile.quiz!.followUps.length);
  const comparison = nextComparison?.kind === "blocker" ? nextComparison : null;
  const answerFollow = (choice: AdaptiveFollowUp["choice"]) => {
    if (!comparison) return;
    update(p => {
      const quiz = p.quiz!;
      const followUps = [...quiz.followUps, { a: comparison.a, b: comparison.b, kind: comparison.kind, choice }];
      return { ...p, quiz: { ...quiz, followUps, result: scoreQuiz(quiz.answers, followUps) } };
    });
    setFollow(false);
  };
  const chosen = profile.quiz!.answers.filter(answer => answer.primary === a.id || answer.secondary === a.id);
  const actual = chosen.slice(0, 2).map(answer => t(questions[answer.questionId - 1].options.find(o => o.archetype === a.id)!.text));
  const share = async () => {
    const text = t("share.body", { name: a.name });
    const url = window.location.origin;
    try {
      if (navigator.share) { await navigator.share({ title: t("share.title"), text, url }); setShareNotice("A little self-discovery, shared!"); }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); setShareNotice("Copied! Share it with someone who gets you."); }
      else setShareNotice(`Share this link: ${url}`);
    } catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setShareNotice(`Share this link: ${url}`); }
  };
  return <Localized><div className="results-page container"><Reveal className="section-heading results-heading"><span className="pill"><Sparkles size={14} /> A LITTLE AHA MOMENT</span><p>{result.status === "clear" ? "We found your procrastination pattern!" : result.status === "mixed" ? "A little of this, a little of that. That’s human." : "A possible pattern is taking shape."}</p><h1>{result.status === "mixed" ? "Meet your mixed profile." : `Meet ${a.name}!`}</h1>{result.status !== "clear" && <span className="result-status">{result.status === "mixed" ? "More than one pattern feels familiar" : "An emerging pattern, worth exploring"}</span>}</Reveal><div className="result-grid"><Reveal className="result-character-card" ><div style={{ background: a.background }} className="result-mascot-area"><span className="result-float-symbol" style={{ color: a.color }}>{a.symbol}</span><Mascot id={a.id} float /><span className="character-tag">{a.name}</span></div><div className="result-fit"><div><strong>Your pattern fit</strong><span>{Math.round(result.scores[0].fitScore * 100)}%</span></div><Progress value={result.scores[0].fitScore} label="Primary pattern fit" /><p>A reflection of your answers, not a probability or diagnosis.</p></div></Reveal><Reveal className="result-story" delay={.1}><span className="eyebrow">A LITTLE UNDERSTANDING</span><h2>{a.name}</h2><div className="inner-thought"><span>THE THOUGHT THAT MIGHT SOUND FAMILIAR</span><blockquote>“{a.thought}”</blockquote></div><h3>What might be underneath</h3><p>{a.rootCause} This is a pattern you can work with, not a permanent part of who you are.</p><h3>When it tends to show up</h3><div className="symptom-chips">{a.symptoms.map(s => <span key={s}>{s}</span>)}</div></Reveal></div>
    {actual.length > 0 && <Reveal className="answer-reflection"><Heart size={22} /><div><h3>A little connection from your answers</h3><p>You recognized: “{actual.join(locale === "fa" ? "» و «" : "” and “") }” These are clues behind this pattern, rather than assumptions about the rest of your life.</p></div></Reveal>}
    {runner && <Reveal className="secondary-profile"><Mascot id={runner.id} /><div><span className="eyebrow">ALSO PART OF YOUR PICTURE</span><h3>{runner.name} <span>{Math.round(result.scores.find(s => s.id === runner.id)!.fitScore * 100)}% pattern fit</span></h3><div className="symptom-chips">{runner.symptoms.map(s => <span key={s}>{s}</span>)}</div></div></Reveal>}
    {comparison && <section className="followup-card"><div className="followup-intro"><Sparkles size={22} /><div><h3>Want to connect a couple more dots?</h3><p>One optional comparison can help explore the patterns that overlap.</p></div>{!follow && <button className="button secondary" onClick={() => setFollow(true)}>Explore a little more <ArrowRight size={15} /></button>}</div>{follow && <div className="followup-questions"><span className="eyebrow">OPTIONAL COMPARISON</span><h2>{comparison.question}</h2><button className="answer-card" onClick={() => answerFollow("a")}><span className="answer-letter">A</span>{comparison.textA}</button><button className="answer-card" onClick={() => answerFollow("b")}><span className="answer-letter">B</span>{comparison.textB}</button><div className="button-row"><button className="button secondary" onClick={() => answerFollow("both")}>Both feel familiar</button><button className="button secondary" onClick={() => answerFollow("neither")}>Neither feels right</button><button className="text-button" onClick={() => setFollow(false)}>Maybe later</button></div></div>}</section>}
    <SolutionUpdates />
    <div className="result-actions"><button className="button secondary" onClick={share}><Share2 size={16} /> Share My Archetype</button><div className="result-minor-actions"><Link href="/#characters">Explore Other Archetypes</Link><button className="text-button" onClick={restart}><RotateCcw size={14} /> Retake Quiz</button></div><p aria-live="polite">{shareNotice}</p></div><p className="result-disclaimer">These educational patterns and matching thresholds are MVP heuristics, not a clinically validated assessment. A pattern fit reflects your selections, not mental health or a fixed personality.</p>
  </div></Localized>;
}

function SolutionUpdates() {
  return <Localized><section className="info-card center solution-notice"><h2>Don’t miss the solutions</h2><p>Solutions will be released in future versions :)</p><p>Join my Telegram channel and follow me on Instagram for upcoming solutions.</p><div className="solution-social-links"><a className="button secondary" href="https://t.me/chamedanish" target="_blank" rel="noopener noreferrer"><Send size={20} aria-hidden="true" /><span className="social-link-copy"><span>Join Telegram</span><span className="social-handle" dir="ltr" translate="no">@chamedanish</span></span></a><a className="button secondary" href="https://www.instagram.com/nastaranashoori_/" target="_blank" rel="noopener noreferrer"><Instagram size={20} aria-hidden="true" /><span className="social-link-copy"><span>Follow on Instagram</span><span className="social-handle" dir="ltr" translate="no">@nastaranashoori_</span></span></a></div></section></Localized>;
}
