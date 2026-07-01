# Romulus
## How I Built My AI — Then Built With It

---

## Act 1 — The Identity

The name came first.

*Romulus* — the founder-king of Rome. Not a conqueror. An architect of systems that outlasted him. That name wasn't decoration. It was the first design decision, and it set the tone for everything that followed.

Before I wrote a single prompt, I asked a harder question: *what should this thing actually be?*

The answer took the shape of a document — SOUL.md. Not a system prompt. A soul document. Who is Romulus? What does he believe? How does he speak? What is he *for*? I gave him contextual modes — precise and efficient when speed mattered, measured and willing to push back when the stakes were high enough to warrant it, a genuine collaborator when a build was going sideways at midnight. I gave him a mission: not productivity, not task automation, but a trusted operator with a defined identity, working toward shared goals over time.

Then USER.md — my context, my background, my actual goals. Ten years in startups. Senior PM at Daylight by day. Solopreneur in the evenings and weekends. What I'm building toward and why.

Then IDENTITY.md, MEMORY.md, AGENTS.md, HEARTBEAT.md, TOOLS.md.

All of it was in place before a single cron job ran. Before a model was selected. Before any code was written.

This is the instinct that comes from ten years of building products for people — you don't start with the technology, you start with the person using it. Here the person using it was me, and the product was my own operating system. I designed it the same way I'd design anything else: identity first, constraints defined, goals clear, then go build.

Roman gravitas, worn lightly. But the intention was real.

---

## Act 2 — The Build

*February 3, 2026. First boot.*

MacBook Pro. OpenClaw installed. Discord integration wired to a private channel — #roma-eterna. First model: Nvidia Kimi K2.5, a free-tier LLM with 128K context. Flat MEMORY.md as the only persistent memory. The first response landed in Discord and came back clean.

That was the floor. Everything since has been earned through a real failure.

---

### The Memory Problem

MEMORY.md is a flat file. Sessions don't carry context automatically — you have to design memory. What gets written, when, by whom, in what format. The early daily notes were sparse. Project files were scattered. Nothing linked to anything else.

The first real upgrade was Obsidian. A vault — `roma-eterna/romulus/` — became the primary memory substrate. Daily notes in `03-Daily/`, project files in `02-Projects/`, decisions in `04-Decisions/`. Backlinks, graph view, semantic search across the whole thing. A knowledge base I could open and read myself — shared memory between me and the system, not just agent-side persistence.

That distinction matters. Good product infrastructure is legible to the humans using it, not just to the machines running it.

---

### The Model Problem

April 9, 2026. A heavy coding session on MiniMax M2.7 — 205K context window, which seemed like enough. The session hit 338 messages and 2.5MB. The context overflowed. Three compaction events fired in sequence. Six consecutive edit tool failures — the model was matching against stale text that no longer existed in the file. The session was gone.

The lesson was familiar: the failure mode was architectural, not accidental. Model selection is infrastructure. Picking the wrong model for the wrong job is a design decision that produces failures that look like AI problems but are problems you built yourself into.

After April 9: Grok 4 Fast for coding sessions — 2M context window. Qwen 3.6 Plus for daily conversation and cron jobs — cheap, fast, right-sized. Claude Code with Opus 4.7 via subscription for all implementation, never the API. Each model has a defined job, a cost budget, and a context ceiling. The routing rules live in the vault. Every new session starts from them.

---

### The Machine Problem

The MacBook Pro was doing everything — running the gateway, running cron jobs, running overnight Claude Code sessions — on a machine that needed to sleep, travel, and hold a full-time job.

March 30, 2026: Mac Mini migration. A dedicated machine — romulus-mini — always on. Auto-login enabled, sleep disabled, FileVault on. A 2TB external SSD for builds, sessions, and storage.

The morning brief stopped disappearing when the laptop lid closed. Claude Code ran while I slept. Background work became actually background.

---

### The Morning Brief Problem

For weeks the morning brief was delivering R train departures from Times Square instead of Prospect Ave.

R16 — the stop ID that looked right in the data — is Times Square. R34N is Prospect Ave northbound. I had to pull the MTA's GTFS static schedule and cross-reference it manually before the data could be trusted.

Plausible-looking data is not verified data. That's a lesson that applies equally to product analytics, user research, and AI output. It lives in the vault now. The brief has served the right station ever since.

---

### The Memory Backend

April 2026. The Obsidian vault was connected to QMD as the indexed primary memory backend. Not just persistent files — semantic search across every daily note, project file, and decision. Before each session, the system queries the vault. The context that comes back reflects the full history of a project, not just the last conversation.

The vault is the brain. Sessions are the work. That split is deliberate, and it's what makes the system compound over time rather than reset.

---

### The Delegation Pattern

The pattern that governs everything now:

1. I give direction — the goal, the constraints, the judgment calls
2. Romulus writes the spec or prompt file
3. Claude Code implements against the codebase
4. Romulus verifies, commits, pushes
5. Romulus reports back

Production code isn't written in the main session. Specs and decisions are. This keeps context clean, keeps implementation in the model built for it, and keeps me in the role I should be in: reviewing diffs and making calls, not writing boilerplate.

The architecture didn't arrive fully formed. It was earned, upgrade by upgrade, from February to May — each change motivated by a real breakdown in the version before it.

---

## Act 3 — A Tuesday

The alarm doesn't fire at 8am. The morning brief does.

By the time I open Discord on my phone, a message is waiting. NWS weather for Park Slope. R train departures from Prospect Ave northbound toward Canal St. Commute score, 1-10. Then three curated product signals, filtered for actual signal — most market noise gets cut before it reaches me.

I read it on the train. Twenty-six minutes, Prospect Ave to Canal St.

At Daylight I'm running product — decisions, roadmaps, team, stakeholders. The day job is demanding and full.

By 10pm I'm back on Discord. A product question. A half-formed spec. A thought on how a UX flow should work. Responses come back in seconds, and they have context — not just from this conversation, but from the last three weeks of decisions in the vault.

A prompt file gets written to the workspace. I type: *run it.*

Claude Code opens. The session starts. By midnight there's a diff. By 2am a commit has landed. By morning a Vercel preview URL is waiting.

GitHub Pages for fast proofs of concept. Vercel for real products with staging and production branches. Cron jobs running overnight as the standing team. Discord as the command surface from anywhere.

And it compounds. The vault from Tuesday shapes Wednesday's brief. The decision from this sprint informs the next one. The system I'm working with in May is materially more capable than the one from February — not because the software was updated, but because the context accumulated, decision by decision, failure by failure.

---

## Act 4 — The Work

### Chronicle — One Day, On a Phone, Through Discord

*Live at thischronicle.com.*

One historical event per day. One image. Guess the year in three attempts. Monday is warm — two clues, guiding. Sunday has none.

The product design is deliberate down to the difficulty arc. Monday eases you in. Wednesday starts to pinch. Saturday's clue is almost poetic — oblique enough to make you feel something when you get it. Sunday is prestige mode: the image alone, no context, no help. That progression isn't decoration, it's the retention mechanic. The kind of detail that gets designed in, not bolted on.

The spec was locked March 29, 2026. The build happened the next day — not at a desk. On my phone, through Discord, with Romulus coordinating and Claude Code running in the background. By end of day: a working Next.js app deployed to Vercel, 90 puzzles seeded, complete scoring logic, share card, stats modal, full difficulty arc across seven days.

One day.

The game design, editorial decisions, difficulty curve, and acquisition thesis all required judgment. The implementation didn't require my hands on a keyboard.

The longer play: Chronicle is built for a specific exit. Clean Next.js code from day one. localStorage-only state — the Wordle model, pre-acquisition. Retention metrics instrumented for D7/D30/D90. No paid tier for an acquirer to unwind. NYT Games is a $9B business with no history game. That's the thesis. The exit is part of the product design.

---

### Forbidden — Research as Product Design

*Live at playforbidden.com.*

Forbidden started as a question about a gap in the market: the mobile party game space has Heads Up! and very little else. The tabletop space has Taboo, but nobody has rethought it seriously for phones. There was clearly something there. The question was what, exactly.

I ran the initial product thesis through three AI models independently — Grok, ChatGPT, and Romulus — each asked to pressure-test it separately and come back with where it was wrong. The answers converged around a contradiction with the original premise.

Forbidden isn't digital Taboo. It isn't a Heads Up clone. It's a *constraint-based pass-the-phone party game* — one player clues under verbal constraint while the group guesses simultaneously in real time. The game's tension comes from steering a room to an answer while navigating the forbidden words. That's a distinct product slot: different social dynamic, different expansion surface, different monetization path than either comparison.

The framing came from the research, not the starting assumption. The research changed the product shape before any code changed.

That's the part I find most useful about working this way — having a system that can pressure-test a thesis from multiple angles before I've committed to building anything. The product design happens earlier and the builds are more intentional because of it.

Current state: 862-card corpus across six themed decks, a fake-door funnel measuring iOS intent, live at playforbidden.com. The web version is the signal layer. The iOS build waits for signal to justify it.

---

### Cherry Street Labs — The Studio

*Live at cherrystreetlabs.com.*

Cherry Street Labs is the entity behind all of it — the one-person software studio housing Chronicle, Forbidden, and whatever comes next. The name is deliberately understated. The work is supposed to speak for itself.

The site itself is worth looking at. The hero is an ASCII fluid distortion shader — a dense monospace character grid running FBM noise with mouse-reactive metaball blobs, rendered in Three.js. The color field runs neon magenta through purple to cyan. It moves like liquid when you interact with it. No build step, no framework, no dependencies beyond a CDN include. Vanilla HTML and about 300 lines of JavaScript.

The effect came from a piece of generative art I came across — a WebGL fluid shader someone had posted. I wanted something that would feel technically interesting without feeling like a portfolio template, and without requiring a React app to load. The constraint of no build step was intentional: it forced the implementation to be lean and the result to be fast.

That's a consistent thread in how I build — constraints as design inputs, not obstacles. localStorage for Chronicle because it removes the backend entirely and signals acquirability. GitHub Pages for fast proofs because zero infrastructure means zero friction. Vanilla JS for Cherry Street Labs because the right tool for a static brochure site isn't a framework.

Cherry Street Labs is the vehicle. The goal is building software that compounds — products designed to grow, acquire, or generate revenue without requiring a team. The studio framing is deliberate: each project shares infrastructure, decisions, and lessons. What I learn on Chronicle makes Forbidden sharper. What breaks on Forbidden teaches me something about Legion.

---

### Legion — The Postmortem

*Phase 1 complete. Shelved.*

Legion was the most ambitious attempt: a multi-agent orchestration layer running in Discord. Five cohorts, each answering one question and handing off to the next. Caesar — is this worth building? Augustus — build it and deploy it. Vespasian — map the path to $20K MRR. Trajan — distribute it. One prompt in Discord, fifteen minutes later: a live deployed product, a wealth strategy, and a launch plan.

Caesar worked well. Fast, clean, structured research and build specs. Augustus scaffolded projects and deployed to GitHub Pages. The Phase 1 architecture held.

What didn't hold: the seams. When the Noctis test — a native iOS Swift app — hit the fifteen-minute timeout on Augustus, the chain stopped. Vespasian and Trajan never ran. State didn't survive across the handoffs. There was no retry logic, no timeout tiering scaled to build complexity, no eval layer to catch when a handoff had silently degraded.

The architecture was sound. The execution substrate needed more rigor — durable task state, structured retry patterns, effort-tiered timeouts matched to scope, regression detection at the handoffs. None of that is exotic engineering. It's the careful, unsexy work that makes orchestration reliable rather than impressive in the right conditions.

I learned more from Legion not fully working than I did from the parts that did. The things that failed pointed directly at what the next version needs to get right. The lessons are documented in the vault. It's Phase 1 of a longer effort.

---

## Act 5 — The Open Question

February 3 to May 1. Eighty-seven days.

One person. One designed system. A Mac Mini running while I sleep. A morning brief landing before the train. Four projects shipped or in flight — one live and built for acquisition, one in active market validation, one studio holding the rest, one ambitious architectural attempt that taught more than it shipped.

The thing I keep returning to: this compounds in a way that feels qualitatively different from just working faster. The decisions accumulate. The failures write lessons the whole system learns from. The vault from May is materially richer than the one from February, and the next project starts from a higher floor because of it.

I've spent ten years developing the judgment to know what to build, how to scope it, how to make it feel right to the people using it. What's new is having infrastructure that extends that judgment — that holds context across weeks, surfaces the right decision history at the right moment, and executes overnight while I'm not at the keyboard.

What happens when a whole product team operates this way? When the AI layer isn't adopted off the shelf but designed — identity, memory, routing, delegation, all of it considered deliberately? I think that's one of the more interesting product and organizational questions of the next few years. I don't have the full answer. But I've been building toward it.

---

*Mike Battaglia*
*Senior PM at Daylight · Founder, Cherry Street Labs*
*Park Slope, Brooklyn · mikebatts.net*
