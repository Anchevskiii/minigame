# Game Design Document: [REDACTED]

**Core Concept:** A daily, global browser-based word puzzle where players deduce the subject of a heavily censored English Wikipedia article by guessing words to reveal the text.

## 1. Content Strategy & Global Dynamics

- **The Source:** English Wikipedia REST API.
- **Curation Strategy:** Articles must be universally recognizable. The system will pull exclusively from Wikipedia's "Vital Articles" or "Featured Articles" lists (e.g., _Gravity, Albert Einstein, The Beatles, Photosynthesis_). Obscure topics will cause immediate player churn.
- **Global Synchronization:** Every player worldwide gets the exact same article on the same day. The puzzle resets globally at **00:00 UTC**. This creates a shared global experience and drives social media FOMO.

## 2. Visual Identity & UI/UX

The aesthetic mimics highly classified, top-secret government documents.

- **Color Themes:**
  - _Light Mode (Default):_ Off-white/parchment background, typewriter fonts for headers, with stark black solid rectangles covering words.
  - _Dark Mode:_ Dark charcoal background with slightly darker, sleek black redaction blocks to reduce eye strain.
- **Top Header:** Minimalist. A logo reading `[REDACTED]`, a "How to Play" icon `(?)`, a Statistics icon `(📊)`, and Settings `(⚙️)`.
- **Main Play Area (The Document):** The article title and introductory paragraphs. Hidden words are replaced by black blocks `██████`. The length of the block exactly matches the character count of the hidden word.
- **Sticky Input Bar:** Anchored to the absolute bottom of the screen (always visible while scrolling). It contains a clean text input field `[ Guess a word... ]` and a prominent `[ GUESS ]` button.
- **Sidebar / Slide-up Menu:** A real-time log of the player's past guesses, showing the word and how many times it appeared (e.g., `apple (4)`, `tree (0)`).

## 3. Core Gameplay Mechanics

1.  **Stop Words (Freebies):** Common English syntax words (the, a, an, in, on, of, and, is, to, etc.) and punctuation are pre-revealed to give the document a basic structural skeleton.
2.  **Smart Guessing (Lemmatization):** Since this is in English, the engine must group word roots. If a player guesses "ACT", the system should ideally also reveal "ACTS", "ACTING", and "ACTED". If this is too complex for the MVP, state clearly in the rules that players must guess exact matches.
3.  **The Reveal (Dopamine Hit):** When a correct word is guessed, all corresponding black blocks flash bright green for 500ms, then dissolve into readable text.
4.  **Auto-Scroll:** Immediately after a successful guess, the screen smoothly auto-scrolls to the first revealed instance of that word in the text so the player can read the new context.

## 4. Hint System (Anti-Frustration)

Players will hit mental walls. To prevent rage-quitting, the game offers a tiered hint system:

- **Tier 1 (Free Hint):** "Reveal a random word." Reveals a mid-tier frequency word (like an adjective or verb) somewhere in the text. Limited to 1 per game.
- **Tier 2 (Premium/Ad Hint):** "Reveal a Title Word." The player watches a 15-to-30-second video ad. In exchange, one of the heavily guarded words in the actual title of the article is revealed.

## 5. Endgame & Virality (The Growth Loop)

The game ends when the player successfully guesses the main word(s) of the article's title.

- **The Unveiling:** A satisfying animation where all remaining black blocks simultaneously fade away, revealing the full article. Confetti pops on the screen.
- **Player Statistics:** A modal pops up showing:
  - Total Guesses: 58
  - Accuracy: 41% (24 hits / 58 guesses)
  - Current Daily Streak: 🔥 12 Days
- **The Viral Share Block:** A highly optimized "Share" button that copies a spoiler-free, visually distinct emoji grid to the clipboard for Twitter/X, Reddit, and WhatsApp.
  ```text
  [REDACTED] #42 🌍
  Guesses: 58 📉
  Accuracy: 41% 🎯
  Hints used: 0 💪
  Play at: redacted-game.com
  ```

## 6. Monetization Strategy

The revenue model relies on high retention and non-intrusive placement.

- **Rewarded Video Ads:** The highest RPM (Revenue Per Mille) earner. Placed strictly behind the "Get a Major Hint" button. Players willingly engage with these ads, causing zero frustration.
- **Discreet Display Ads:** A single, clean banner ad placed either at the very bottom of the guess log or embedded subtly between the 3rd and 4th paragraphs of the article. No pop-ups, no screen-takeovers.
- **The Subscription Model (SaaS):** The daily game is 100% free. However, for a small monthly fee (e.g., $2.99/month), users get:
  1.  A completely Ad-Free experience.
  2.  **The Archive:** Access to play all past puzzles from Day 1. (This is the biggest selling point for hardcore fans who discover the game late and want to binge-play).
