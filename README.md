# [REDACTED] — Classified Daily Word Deduction Game

A daily, global browser-based word puzzle where players deduce the confidential subject of a heavily censored English Wikipedia article by guessing words to declassify the document.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Generate Daily Puzzles from Wikipedia
To fetch and compile new Wikipedia Vital/Featured articles into structured token puzzles:
```bash
npm run build-puzzles
```
This fetches selected articles (e.g. *Albert Einstein*, *Gravity*, *Photosynthesis*, *The Beatles*, *Pyramid*), parses lead sections, pre-reveals stop words, calculates word stems, and compiles static JSON assets into `public/puzzles/`.

### 4. Run Logic & Architecture Tests
```bash
node --experimental-strip-types scripts/test-game-logic.mjs
```

### 5. Build Production Bundle
```bash
npm run build
```

---

## 🎮 Key Features & Mechanics

- **Authentic Classified Government Dossier UI:**
  - Typewriter typography (`Special Elite`, `Courier Prime`, `Newsreader`).
  - Redaction blocks `██████` matching exact word length.
  - Three visual themes: **Classified Parchment (Light)**, **Charcoal Noir (Dark)**, and **CRT Terminal Phosphor (Green)**.
  - Web Audio API synthesizer for mechanical typewriter clacks and reveal chimes.
- **Smart Guessing (Lemmatization & Normalization):**
  - Built-in zero-dependency English Porter stemmer: guessing `ACT` automatically reveals `ACTS`, `ACTING`, and `ACTED`.
- **Global Synchronization:**
  - Resets globally at **00:00 UTC** with live countdown timer.
- **Tiered Hint System:**
  - **Tier 1 (Free Hint):** Deploys a reconnaissance intercept to reveal a high-frequency context keyword.
  - **Tier 2 (Rewarded Ad Hint):** Interactive classified satellite broadcast simulation that declassifies a protected Title word.
- **Endgame & Virality:**
  - Declassification unveil animation & confetti explosion.
  - One-click spoiler-free emoji share card for Twitter/X, Reddit, and WhatsApp.
- **Historical Archive & SaaS Model:**
  - Play past daily puzzles with the Field Operative Archive Pass ($2.99/mo simulation).
- **Privacy & GDPR Compliance (Articles 17 & 20):**
  - Zero third-party tracker cookies.
  - **Export Dossier:** 1-click JSON export of career statistics and guess logs.
  - **Purge Dossier:** Soft-delete / complete reset of local data.

---

## 🏛️ Technical Architecture Plan

The full production architecture, database schema (PostgreSQL DDL), edge CDN caching strategy, and GDPR evaluations are documented in:
👉 `C:\Users\ancev\.gemini\antigravity-ide\brain\9b9ce1c7-a55d-4e86-aa69-7b1e3668722b\technical_architecture_plan.md`
