"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useApp } from "@/store/provider";
import { newQuiz } from "@/lib/storage";
import { scoreQuiz } from "@/lib/archetypes/scoring";
import { questions } from "@/data/questions";
import { Mascot } from "@/components/mascot";
import { Loading, Progress } from "@/components/ui";
import { demographicsSchema, emailSchema, type ArchetypeId, type QuizAnswer } from "@/types";
import { Localized } from "@/i18n/provider";

export function Quiz() {
  const { profile, update, retake } = useApp(); const router = useRouter();
  const [age, setAge] = useState<string | null>(null);
  const [sex, setSex] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const reduced = useReducedMotion();
  const quiz = profile?.quiz;
  const ageValue = age ?? String(quiz?.demographics?.age ?? "");
  const sexValue = sex ?? quiz?.demographics?.sex ?? "";
  useEffect(() => { if (profile && !profile.quiz) update(p => ({ ...p, quiz: newQuiz() })); }, [profile, update]);
  useEffect(() => { if (quiz?.started) heading.current?.focus(); }, [quiz?.index, quiz?.started]);
  if (!profile || !quiz) return <Loading />;
  if (quiz.finished) return <Localized><section className="narrow page-section center"><Mascot id="dreamer" className="intro-mascot" /><span className="eyebrow">NICE TO SEE YOU AGAIN</span><h1>Your little discovery is ready.</h1><p>You can revisit your pattern, or take a fresh look at what feels like you today.</p><div className="button-row centered"><Link href="/results" className="button">See my results <ArrowRight size={16} /></Link><button className="button secondary" onClick={retake}><RotateCcw size={16} /> Retake Quiz</button></div></section></Localized>;
  if (!quiz.started || !quiz.demographics || !quiz.email) return <Localized><section className="quiz-intro narrow page-section center"><div className="intro-art"><span className="intro-art-circle" /><Mascot id="perfectionist" float /><span className="intro-spark">✧</span></div><span className="eyebrow">A LITTLE CURIOUS ABOUT YOU</span><h1>Let’s figure out what’s<br />really stopping you.</h1><p>Think about the important things you’ve put off over the past month. There are no wrong answers. Just pick what feels most like you.</p><form className="demographics-form" onSubmit={event => {
    event.preventDefault();
    const parsed = demographicsSchema.safeParse({ age: Number(ageValue), sex: sexValue });
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsed.success || !parsedEmail.success) { setFormError(true); return; }
    setFormError(false);
    update(p => ({ ...p, quiz: { ...quiz, email: parsedEmail.data, demographics: parsed.data, started: true } }));
  }}><h2>Before we begin</h2><p>Please enter your age, sex, and email to start the quiz. These are saved with your answers and result.</p><div className="demographics-fields"><div><label className="field-label" htmlFor="quiz-age">Age</label><input id="quiz-age" type="number" inputMode="numeric" min="1" max="120" step="1" required value={ageValue} onChange={event => setAge(event.target.value)} autoComplete="off" /></div><div><label className="field-label" htmlFor="quiz-sex">Sex</label><select id="quiz-sex" required value={sexValue} onChange={event => setSex(event.target.value)}><option value="" disabled>Select your sex</option><option value="female">Female</option><option value="male">Male</option><option value="intersex">Intersex</option><option value="prefer_not_to_say">Prefer not to say</option></select></div><div className="email-field"><label className="field-label" htmlFor="quiz-email">Email address</label><input id="quiz-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} dir="ltr" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); setFormError(false); }} aria-describedby={formError ? "quiz-form-error" : undefined} /></div></div>{formError && <p id="quiz-form-error" role="alert">Please enter a valid age, sex, and email address.</p>}<button className="button" type="submit">Let’s Go! <ArrowRight size={18} /></button></form><div className="intro-details"><span><Sparkles size={15} /> 10 quick questions</span><span><Heart size={15} /> No wrong answers</span><span><ShieldCheck size={15} /> Progress saved</span></div><p className="fine-print">For self-reflection, not a clinical assessment. Your patterns aren’t permanent.</p></section></Localized>;
  const question = questions[quiz.index];
  const answer = quiz.answers.find(a => a.questionId === question.id);
  const save = (a: QuizAnswer) => update(p => ({ ...p, quiz: { ...quiz, answers: [...quiz.answers.filter(a => a.questionId !== question.id), ...(a.primary || a.none || a.skipped ? [a] : [])] } }));
  const choose = (id: ArchetypeId) => {
    if (answer?.primary === id) save({ questionId: question.id, primary: answer.secondary });
    else if (answer?.secondary === id) save({ questionId: question.id, primary: answer.primary });
    else if (!answer?.primary) save({ questionId: question.id, primary: id });
    else if (!answer.secondary) save({ questionId: question.id, primary: answer.primary, secondary: id });
  };
  const advance = (skip: boolean) => {
    const answers = skip ? [...quiz.answers.filter(a => a.questionId !== question.id), { questionId: question.id, skipped: true }] : quiz.answers;
    update(p => ({ ...p, quiz: { ...quiz, answers, index: Math.min(9, quiz.index + 1), finished: quiz.index === 9, result: quiz.index === 9 ? scoreQuiz(answers, quiz.followUps) : undefined } }));
    if (quiz.index === 9) router.push("/results");
  };
  return <Localized><section className="quiz-page"><div className="quiz-top"><Link href="/" className="text-button"><ArrowLeft size={15} /> Back home</Link><span><ShieldCheck size={14} /> Saved as you go</span></div><div className="quiz-layout"><aside className="quiz-side"><span className="pill"><Sparkles size={14} /> YOUR LITTLE DISCOVERY</span><Mascot id={quiz.index % 3 === 0 ? "perfectionist" : quiz.index % 3 === 1 ? "dreamer" : "worrier"} float /><h3>Getting to know<br />the wonderfully human you.</h3><p>There’s no perfect answer.<br />Just the one that feels familiar.</p><div className="quiz-side-note"><Heart size={17} /><span>You can be more than one thing.<br />We’re looking for patterns, not boxes.</span></div></aside><div className="quiz-main"><div className="quiz-progress-label"><span>QUESTION <strong>{quiz.index + 1}</strong> OF 10</span><span>{Math.round(quiz.index / 10 * 100)}% of the way</span></div><Progress value={quiz.index / 10} label="Quiz progress" /><AnimatePresence mode="wait"><motion.div key={question.id} initial={reduced ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}><h1 ref={heading} tabIndex={-1} className="question-title">{question.text}</h1><p className="question-hint" id="selection-help">Choose up to two answers, in order. First: very similar. Second: similar (optional).</p><div className="selection-legend" aria-label="Answer color guide"><span className="primary-key"><b>1</b> Purple = Very similar</span><span className="secondary-key"><b>2</b> Teal = Similar (optional)</span></div><p className="field-hint">Tap a selected answer to remove it. The remaining answer becomes your first choice.</p><div className="answer-list" role="group" aria-describedby="selection-help" aria-label="Answers">{quiz.orders[quiz.index].map((id, i) => {
      const option = question.options.find(o => o.archetype === id)!;
      const selection = answer?.primary === id ? "1 · Very similar" : answer?.secondary === id ? "2 · Similar" : null;
      return <button className={`answer-card ${selection ? "is-selected" : ""} ${answer?.secondary === id ? "is-secondary" : ""}`} key={id} onClick={() => choose(id)} disabled={!!answer?.primary && !!answer.secondary && !selection} aria-pressed={!!selection}><span className="answer-letter">{selection ? <Check size={15} /> : String.fromCharCode(65 + i)}</span><span>{option.text}</span>{selection && <span className="selection-badge">{selection}</span>}</button>;
    })}<button className={`none-answer ${answer?.none ? "is-selected" : ""}`} aria-pressed={!!answer?.none} onClick={() => save({ questionId: question.id, none: true })}>{answer?.none && <Check size={14} />} None of these feel like me</button></div></motion.div></AnimatePresence><div className="quiz-controls"><button className="text-button" disabled={quiz.index === 0} onClick={() => update(p => ({ ...p, quiz: { ...quiz, index: quiz.index - 1 } }))}><ArrowLeft size={17} /> Back</button><button className="text-button skip-question" onClick={() => advance(true)}>Skip question</button><button className="button" disabled={!answer?.primary && !answer?.none} onClick={() => advance(false)}>{quiz.index === 9 ? "Meet My Pattern" : "Continue"} <ArrowRight size={17} /></button></div><p className="quiz-bottom-note">A snapshot of your habits, not a label for life.</p></div></div></section></Localized>;
}
