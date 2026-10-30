# ProcrastiNot

**Less overthinking. More doing.** A bilingual Next.js App Router app for playful procrastination self-reflection.

The current release focuses on archetype symptoms and the quiz. Solutions, exercises, the growth dashboard, and the chatbot are hidden from the user experience. Solutions will be released in future versions :)

## Run locally

Requires Node.js **22.12+** (Node 24 recommended) and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:3000**. If another app uses that port, run `npm run dev -- --port 3001`.

The quiz works without secrets and saves progress in the browser. Connect a database to record completed assessments centrally. Environment variables stay server-side. Restart the server after editing `.env`.

## Connect Neon + Prisma

1. Create a Neon Postgres project and database.
2. Paste the **pooled** connection string into `DATABASE_URL` in `.env.local` (or `.env`).
3. Paste the **direct / non-pooled** connection string into `DIRECT_URL`. **A `DIRECT_URL` alone also works**: the app uses it when `DATABASE_URL` is empty. For Neon, the migration configuration removes `-pooler` from a pooled hostname automatically, while the runtime retains the pooled URL. Include Neon's `sslmode=require` parameters. Both Next.js and Prisma load `.env.local` before `.env`. `.env.example` is a blank template, not a place for secrets.
4. Set `ANALYTICS_SECRET` to a long random value of your choice.
5. Apply the included migrations (including the age/sex and email columns):

```bash
npm run db:generate
npm run db:migrate
```

`npm run db:studio` opens a local database viewer. `npm run db:push` is available for disposable development databases; use the included migrations for deployments.

### What gets recorded

- **Visitor:** one random anonymous browser ID, first visit, latest visit. Repeat visits upsert the same record.
- **Assessment:** one row per completed quiz session, with age, sex, email, each question's ranked answers (or explicit none/skipped state), follow-ups, all 12 normalized scores, result status, primary/secondary pattern, and scoring version. Retaking creates a new session; refreshes do not create duplicate results. Age, sex, and a valid email are required for new submissions; historical database rows may have null age/sex/email.
- Scores are **recomputed on the server**, rather than trusted from the browser. Follow-ups are checked against the actual top-two comparison. Conditional writes prevent older requests from overwriting newer follow-up results.
- The current quiz's age, sex, email, answers, and computed final result are also saved in browser storage. Older saved quizzes remain readable; an unfinished quiz without an email asks for it before continuing. Existing exercise and conversation data are preserved locally while those features are paused.

**Visitor counts estimate unique browsers, not verified people.** Clearing browser data, using another browser, or using another device creates a new visitor. There is no authentication or cross-device sync.

### View usage totals

Keep the analytics token private. From a terminal or server, call:

```bash
curl http://localhost:3000/api/stats \
  -H "Authorization: Bearer YOUR_ANALYTICS_SECRET"
```

The response includes `visitors`, `assessments`, `activeLast7Days`, `recentAssessments`, `byArchetype`, and `byStatus`. This endpoint never returns individual answers or visitor IDs. Use Prisma Studio to inspect individual database records.

If both `DATABASE_URL` and `DIRECT_URL` are empty, recording endpoints return `{ "enabled": false }`. Browser progress remains functional. Failed database writes do not block the quiz; recording is retried on refresh and when the browser reconnects. A retake replaces the browser's current quiz, so this is best-effort analytics rather than a durable offline upload queue.

## Paused AI integration (future versions)

The chatbot is not mounted in the app, and solution routes show a coming-soon page. The integration code and configuration below are retained for future versions.

### OpenRouter (no OpenAI key needed)

Add these to your private `.env.local` file:

```env
OPENROUTER_API_KEY="your-openrouter-key"
OPENROUTER_MODEL="openai/gpt-4o-mini"
```

`OPENROUTER_MODEL` can be any compatible chat model ID from OpenRouter. The default is a paid model billed through your OpenRouter account; choose a model your key/account can access. Restart development after editing configuration.

The server uses the OpenAI-compatible SDK with **`https://openrouter.ai/api/v1`**. Both ProcrastiBuddy and Tiny Mission step suggestions share the same provider configuration, message limits, timeouts, input validation, and per-IP in-memory rate limiting. The SDK name does not mean you need an OpenAI account or key.

Direct OpenAI access remains optional via `OPENAI_API_KEY` / `OPENAI_MODEL`. An OpenRouter key takes priority; router keys pasted into the older `OPENAI_API_KEY` field are also recognized automatically.

Without a key, **Guided support** is clearly displayed and deterministic, scenario-aware coaching is used. API/model failures also fall back transparently. Exercises never depend on AI. On a multi-instance deployment, supplement the per-process limits with a shared gateway or platform rate limiter.

## Mascot artwork

All **12 uploaded mascot illustrations** in `public/mascots/` are connected throughout the app. Their original generated filenames are preserved and centrally mapped in **`src/data/mascot-assets.ts`**, then included in each typed archetype definition. See `public/mascots/README.md` for the character-to-file reference.

The shared Mascot component uses Next.js responsive image optimization, stable dimensions, and a soft edge treatment for the square white-background artwork. Matching SVG characters provide a fallback if an image is missing or fails to load.

To replace an illustration, add the new image to `public/mascots/` and update `src/data/mascot-assets.ts`. Restart development / rebuild production after adding or renaming assets.

## English and Persian (فارسی)

Use the language selector in the top navigation to switch between English and Persian on any screen. The selection persists in a same-site preference cookie. Next.js reads that cookie to render the initial page with the correct `lang` and `dir`, including after a refresh.

- Translation catalogs: **`src/i18n/en.json`** and **`src/i18n/fa.json`**.
- Provider and render-time UI translation boundary: `src/i18n/provider.tsx`.
- Shared translation/interpolation and number formatting: `src/i18n/translate.ts`.
- Persian uses locally hosted **Vazirmatn**, RTL layouts, mirrored navigation arrows, and localized dates/numerals.
- All quiz questions, responses, archetype explanations, follow-ups, challenges, dashboard, privacy/reset dialogs, and companion controls have Persian translations.
- Guided coaching recognizes Persian scenarios. Live AI and suggested steps receive the selected language in the validated API request.
- Language switching preserves quiz progress, answer IDs, activity, and XP. User-entered tasks, wins, reflections, and messages are protected with `translate="no"` and remain exactly as written.

To add or revise copy, keep message IDs synchronized in both JSON catalogs. `useLanguage().t(id, params)` supports explicit interpolation. The `Localized` component translates catalogued text and accessible labels during React rendering, using English catalog values to look up shared static/data-driven copy; it never rewrites the DOM, identifiers, URLs, input values, or handlers. Wrap new visible UI in that boundary and protect user-generated content explicitly.

## Features & routes

| Route | Experience |
| --- | --- |
| `/` | Illustrated landing, how it works, all 12 archetypes shown immediately, click-to-view symptoms, single-column cards on mobile, future-solutions notice |
| `/quiz` | Required age (integer 1–120), sex, and email, 10 questions, ranked selection of up to two answers, exclusive None, skip/back, stable shuffled options, refresh recovery |
| `/results` | Saved final result, pattern fit and symptoms, clear/mixed/tentative/insufficient states, one optional blocker comparison, sharing |
| `/games`, `/games/[game]`, `/dashboard` | Coming-soon notice for future solutions |

The first answer selected is **purple / Very similar** (2 points); the optional second is **teal / Similar** (1 point). Both have numbered text labels and a visible legend. Tapping a selected answer removes it; the remaining answer becomes first choice. Remove a choice before adding another once two are selected.

Privacy information and local reset are in the footer. Reset erases browser progress, not existing server records.

### Matching & rewards

`src/lib/archetypes/scoring.ts` implements deterministic weighted matching. Fit is points / (2 × **actual** opportunities), including completed None exposures and adaptive comparisons, excluding skipped questions. Ranking uses fit, primary count, points, then stable archetype order. Educational heuristic thresholds determine whether any pattern can be shown; no AI decides results.

`src/lib/gamification/xp.ts` validates explicit completion events and deduplicates by session UUID. XP/levels/badges derive from the saved event ledger. No punitive streaks or missed-day penalties.

`src/lib/storage.ts` validates versioned browser data using Zod; corrupt or incompatible data recovers to a fresh profile. `src/store/provider.tsx` is the persistence boundary and can later be replaced with a database-backed repository. Completed exercise details are archived locally, in addition to the current saved game draft and activity ledger.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts its own **production** server on **3100**, avoiding the normal development server and its directory lock. Run `npm run build` before `npm run test:e2e`. Tests use deterministic answer fixtures, isolated browser storage, and disabled external database/AI connections. Browser coverage includes English/Persian demographics and complete quiz journeys, rank ordering and the two-answer limit, removal/promotion, saved results, hidden chatbot/solutions, all 12 uploaded images, accessibility, and overflow checks at **320, 375, 390, 430, 768, 1024, and 1440px**. Unit tests also cover the retained future exercise and AI modules.

## Deployment

### Vercel + Neon

1. Put the project in a GitHub repository. Include `src/`, `public/`, `prisma/` (including migrations), the package files, and the root configuration files. The included `.gitignore` excludes `.env`, `.env.local`, `node_modules/`, and `.next/`.
2. In [Vercel](https://vercel.com), choose **Add New → Project**, import that repository, and select the **Next.js** framework. Use **Node.js 24.x** (22.x also works).
3. Add these environment variables in the Vercel project settings before deploying:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** connection string, including `sslmode=require` |
   | `DIRECT_URL` | Neon **direct/non-pooled** connection string |
   | `ANALYTICS_SECRET` | A long random value for the optional private stats endpoint |

   You can reuse the database already configured in your local `.env.local` / `.env`. Set the variables for **Production**, and for **Preview** if you want preview deployments to record assessments. AI keys are not needed for this release.
4. Set **Install Command** to `npm ci` and **Build Command** to `npm run db:migrate && npm run build`. Leave the output directory at the Next.js default. The migration step applies any missing database columns before building.
5. Click **Deploy**. Vercel provides an HTTPS `*.vercel.app` address. To use your own domain, open **Settings → Domains**, add it, and follow Vercel's displayed DNS instructions.
6. Complete a quiz on the live URL and check the **Assessment** table in Neon or Prisma Studio. Each completed quiz should have an email, age, sex, answers, and its calculated result. Git pushes to the production branch trigger subsequent deployments.

The app ships a web manifest and scalable icon as a foundation for a future PWA; offline caching/service-worker support is not enabled.

This framework is for educational self-reflection. It is not a clinically validated diagnostic instrument, and pattern fit is not a clinical confidence or probability.
# procrastination-quiz
# procrastination-quiz
# procrastination-quiz
# procrastination-quiz
