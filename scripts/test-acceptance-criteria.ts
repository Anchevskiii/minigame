process.env.NODE_ENV = 'test';

import type { Server } from 'http';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAcceptanceTests() {
  const { createApp } = await import('../backend/src/index.js');

  console.log('==============================================================');
  console.log(' [REDACTED] MVP — End-to-End Preverjanje Pogojev Sprejemljivosti');
  console.log('==============================================================\n');

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3009;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health & Security Headers (Helmet + CORS)
    console.log('1. Preverjanje zdravstvenega stanja in varnostnih zaglavij (Helmet)...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, 'GET /api/health mora vrniti 200');
    assert(
      healthRes.headers.get('x-content-type-options') === 'nosniff',
      'Helmet mora nastaviti X-Content-Type-Options: nosniff'
    );
    const healthData = (await healthRes.json()) as { status: string; antiCheatMasking: boolean };
    assert(healthData.status === 'ok' && healthData.antiCheatMasking === true, 'Health mora potrditi antiCheatMasking');
    console.log('   ✅ Varnostna zaglavja in /api/health delujejo.');

    // 2. US-01 & ADR 0003: Server-side Masking of Daily Puzzle
    console.log('2. [US-01 / ADR 0003] Preverjanje strežniškega maskiranja dnevne uganke...');
    const todayRes = await fetch(`${baseUrl}/api/game/today`);
    assert(todayRes.status === 200, 'GET /api/game/today mora vrniti 200');
    const todayData = (await todayRes.json()) as {
      puzzle: {
        id: string;
        puzzleNumber: number;
        wikipediaTitle: string;
        wikipediaUrl: string;
        titleTokens: Array<{
          type: string;
          isStopWord?: boolean;
          text: string;
          canonical?: string;
          stem?: string;
          isRevealed: boolean;
        }>;
      };
      session: {
        id: string;
      };
    };
    assert(todayData.puzzle.wikipediaTitle === '[CLASSIFIED]', 'Naslov članka mora biti maskiran kot [CLASSIFIED]');
    assert(todayData.puzzle.wikipediaUrl === '', 'Wikipedia URL ne sme biti poslan odjemalcu pred zmago');
    const hiddenTitleWords = todayData.puzzle.titleTokens.filter((t) => t.type === 'word' && !t.isStopWord);
    assert(hiddenTitleWords.length > 0, 'Naslov mora imeti skrite besede');
    for (const token of hiddenTitleWords) {
      assert(/^█+$/.test(token.text), 'Besedilo skritega žetona mora biti nadomeščeno z začrnjenimi bloki (█)');
      assert(token.canonical === undefined && token.stem === undefined, 'Skriti žeton ne sme vsebovati canonical ali stem');
      assert(token.isRevealed === false, 'Skriti žeton mora imeti isRevealed=false');
    }
    console.log('   ✅ Strežniško maskiranje (Anti-Cheat) potrjeno — v omrežnem prometu ni skritih besed.');

    // 3. US-01: Guessing words & duplicate prevention & input validation
    console.log('3. [US-01] Preverjanje ugibanja besed, validacije vnosa in preprečevanja dvojnikov...');
    const invalidGuessRes = await fetch(`${baseUrl}/api/game/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId: todayData.puzzle.id,
        sessionId: todayData.session.id,
        word: '12345'
      })
    });
    assert(invalidGuessRes.status === 400, 'Številčni vnos brez črk mora vrniti 400');

    const guessRes = await fetch(`${baseUrl}/api/game/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId: todayData.puzzle.id,
        sessionId: todayData.session.id,
        word: 'physics'
      })
    });
    assert(guessRes.status === 200, 'POST /api/game/guess za "physics" mora vrniti 200');
    const guessData = (await guessRes.json()) as {
      alreadyGuessed: boolean;
      hits: number;
      newlyRevealedTokens: Array<{ id: number; text: string }>;
      isWon: boolean;
    };
    assert(guessData.alreadyGuessed === false, 'Prvi ugib besede ne sme biti označen kot podvojen');
    assert(guessData.hits > 0, 'Beseda "physics" mora imeti zadetke v članku Gravity');
    assert(guessData.newlyRevealedTokens.length === guessData.hits, 'Vrnjeni morajo biti razkriti žetoni');
    assert(guessData.isWon === false, 'Igra še ne sme biti dobljena pred ugotovitvijo naslova');

    // Duplicate guess check (US-01 AC #4)
    const duplicateGuessRes = await fetch(`${baseUrl}/api/game/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId: todayData.puzzle.id,
        sessionId: todayData.session.id,
        word: 'PHYSICS'
      })
    });
    const duplicateData = (await duplicateGuessRes.json()) as { alreadyGuessed: boolean };
    assert(duplicateData.alreadyGuessed === true, 'Ponovni vnos iste besede mora vrniti alreadyGuessed=true');
    console.log(`   ✅ Ugibanje "physics" uspelo (${guessData.hits} zadetkov) in dvojnik preprečen.`);

    // 4. US-03 & US-04: Tiered Hints (up to 3 basic hints + 1 title hint on multi-word title)
    console.log('4. [US-03 / US-04] Preverjanje stopnjevanih namigov (3 osnovni + 1 namig za naslov)...');
    // Fetch Puzzle #1 ("Albert Einstein") which has 2 words in title
    const puzzle1Res = await fetch(`${baseUrl}/api/game/puzzle/1`);
    const puzzle1Data = (await puzzle1Res.json()) as {
      puzzle: { id: string };
      session: { id: string };
    };

    for (let i = 1; i <= 3; i++) {
      const hintRes = await fetch(`${baseUrl}/api/game/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: puzzle1Data.puzzle.id,
          sessionId: puzzle1Data.session.id,
          type: 'basic'
        })
      });
      assert(hintRes.status === 200, `Osnovni namig #${i} mora uspeti`);
    }
    const fourthBasicRes = await fetch(`${baseUrl}/api/game/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId: puzzle1Data.puzzle.id,
        sessionId: puzzle1Data.session.id,
        type: 'basic'
      })
    });
    assert(fourthBasicRes.status === 400, '4. osnovni namig mora biti zavrnjen (omejitev 3 na igro)');

    // Title hint on single-word title (today's puzzle #2 "Gravity") must be rejected
    const singleWordTitleHintRes = await fetch(`${baseUrl}/api/game/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId: todayData.puzzle.id,
        sessionId: todayData.session.id,
        type: 'title'
      })
    });
    assert(singleWordTitleHintRes.status === 400, 'Namig za naslov pri enobesednem naslovu mora vrniti 400');

    // Title hint on multi-word title (puzzle #1 "Albert Einstein") must succeed once
    const multiWordTitleHintRes = await fetch(`${baseUrl}/api/game/hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId: puzzle1Data.puzzle.id,
        sessionId: puzzle1Data.session.id,
        type: 'title'
      })
    });
    assert(multiWordTitleHintRes.status === 200, 'Namig za naslov pri večbesednem naslovu (#1 Albert Einstein) mora vrniti 200');
    console.log('   ✅ Omejitve namigov (3 osnovni + 1 naslovni samo za >=2 besedi) potrjene.');

    // 5. US-06 & US-07: User Registration, Login, Session Persistence & Win Condition
    console.log('5. [US-06 / US-07 / US-14] Preverjanje avtentikacije, shranjevanja seje in dosežkov...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'igralec@redacted.si', password: 'geslo123' })
    });
    assert(loginRes.status === 200, 'Prijava demo igralca mora vrniti 200');
    const loginData = (await loginRes.json()) as { token: string; user: { id: string; role: string } };
    const playerToken = loginData.token;
    assert(Boolean(playerToken), 'Prijava mora vrniti JWT žeton');

    // Solve archived puzzle #3 ("Photosynthesis") as authenticated player
    const puzzle3Res = await fetch(`${baseUrl}/api/game/puzzle/3`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    const puzzle3Data = (await puzzle3Res.json()) as {
      puzzle: { id: string };
      session: { id: string };
    };

    const winGuessRes = await fetch(`${baseUrl}/api/game/guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${playerToken}`
      },
      body: JSON.stringify({
        puzzleId: puzzle3Data.puzzle.id,
        sessionId: puzzle3Data.session.id,
        word: 'photosynthesis',
        durationSeconds: 75
      })
    });
    assert(winGuessRes.status === 200, 'Zmagovalni ugib "photosynthesis" mora vrniti 200');
    const winGuessData = (await winGuessRes.json()) as {
      isWon: boolean;
      fullPuzzle?: { wikipediaTitle: string; wikipediaUrl: string };
      unlockedAchievements: Array<{ code: string; title: string }>;
    };
    assert(winGuessData.isWon === true, 'Ugib "photosynthesis" mora zaključiti igro (isWon = true)');
    assert(
      winGuessData.fullPuzzle?.wikipediaTitle === 'Photosynthesis',
      'Ob zmagi se mora razkriti polni naslov "Photosynthesis"'
    );
    assert(
      Boolean(winGuessData.fullPuzzle?.wikipediaUrl),
      'Ob zmagi mora biti vrnjena povezava do izvirnega članka (US-05)'
    );
    console.log(
      `   ✅ Zmaga potrjena, seja shranjena, odklenjeni dosežki: ${winGuessData.unlockedAchievements
        .map((a) => a.code)
        .join(', ')}`
    );

    // 6. US-12 & US-14: Personal Stats & Achievements
    console.log('6. [US-12 / US-14] Preverjanje osebne statistike in značk...');
    const statsRes = await fetch(`${baseUrl}/api/stats/me`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    assert(statsRes.status === 200, 'GET /api/stats/me mora vrniti 200');
    const statsData = (await statsRes.json()) as {
      stats: { gamesWon: number; currentStreak: number };
      achievements: Array<{ code: string; unlocked: boolean }>;
    };
    assert(statsData.stats.gamesWon >= 1, 'Število zmag mora biti vsaj 1');
    assert(statsData.achievements.length === 6, 'Sistem mora vrniti vseh 6 definiranih dosežkov iz podatkovnega modela');
    console.log('   ✅ Osebna statistika in značke pravilno posodobljene.');

    // 7. US-08 & US-09: Archive & Daily Leaderboard
    console.log('7. [US-08 / US-09] Preverjanje arhiva preteklih ugank in dnevne lestvice...');
    const archiveRes = await fetch(`${baseUrl}/api/archive`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    assert(archiveRes.status === 200, 'GET /api/archive mora vrniti 200');
    const archiveData = (await archiveRes.json()) as {
      archive: Array<{ puzzleNumber: number; solved: boolean }>;
    };
    assert(archiveData.archive.length >= 5, 'Arhiv mora vsebovati objavljene in arhivirane uganke');
    const solved3 = archiveData.archive.find((a) => a.puzzleNumber === 3);
    assert(solved3?.solved === true, 'Rešena uganka #3 mora imeti status solved=true v arhivu');

    const lbRes = await fetch(`${baseUrl}/api/leaderboard`);
    assert(lbRes.status === 200, 'GET /api/leaderboard mora vrniti 200');
    const lbData = (await lbRes.json()) as {
      daily: Array<{ rank: number; username: string; guessesCount: number; durationSeconds: number }>;
    };
    assert(lbData.daily.length >= 3, 'Dnevna lestvica mora vsebovati zmagovalne rezultate');
    for (let i = 1; i < lbData.daily.length; i++) {
      const prev = lbData.daily[i - 1];
      const curr = lbData.daily[i];
      const properlyOrdered =
        prev.guessesCount < curr.guessesCount ||
        (prev.guessesCount === curr.guessesCount && prev.durationSeconds <= curr.durationSeconds);
      assert(properlyOrdered, 'Lestvica mora biti razvrščena po najmanjšem št. poskusov in nato po času');
    }
    console.log('   ✅ Arhiv in dnevna lestvica (razvrščanje po poskusih in času) potrjeno.');

    // 8. US-10, US-11, US-15: RBAC, Wikipedia Import SSRF Protection, Editorial Calendar & Admin Console
    console.log('8. [US-10 / US-11 / US-15] Preverjanje RBAC pravic, SSRF zaščite in uredniškega koledarja...');
    // Player must be forbidden from accessing /api/admin/puzzles
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/puzzles`, {
      headers: { Authorization: `Bearer ${playerToken}` }
    });
    assert(forbiddenRes.status === 403, 'Navadni igralec (PLAYER) mora prejeti 403 Forbidden na /api/admin/puzzles');

    // Login as Admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@redacted.si', password: 'geslo123' })
    });
    const adminLoginData = (await adminLoginRes.json()) as { token: string; user: { id: string } };
    const adminToken = adminLoginData.token;

    // SSRF check: non-Wikipedia URL must be rejected
    const ssrfRes = await fetch(`${baseUrl}/api/admin/puzzles/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ wikipediaUrl: 'http://127.0.0.1:8080/internal-secret' })
    });
    assert(ssrfRes.status === 400, 'SSRF zaščita mora zavrniti ne-Wikipedia URL z 400');

    // Valid Wikipedia import preview
    const importRes = await fetch(`${baseUrl}/api/admin/puzzles/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ wikipediaUrl: 'https://en.wikipedia.org/wiki/Quantum_mechanics' })
    });
    assert(importRes.status === 200, 'Veljaven Wikipedia URL mora ustvariti predogled uganke');
    const importData = (await importRes.json()) as {
      title: string;
      wikipediaUrl: string;
      summaryLead: string;
      tokenData: unknown;
    };
    assert(Boolean(importData.title), 'Uvoz mora vrniti naslov članka');

    // Schedule new puzzle & verify duplicate date conflict check (US-11)
    const scheduleDate = `2099-11-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
    const createPuzzleRes = await fetch(`${baseUrl}/api/admin/puzzles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: importData.title,
        wikipediaUrl: importData.wikipediaUrl,
        difficulty: 'HARD',
        releaseDate: scheduleDate,
        summaryLead: importData.summaryLead,
        tokenData: importData.tokenData
      })
    });
    assert(createPuzzleRes.status === 201, 'Shranjevanje nove uganke v koledar mora vrniti 201');
    const createdPuzzleData = (await createPuzzleRes.json()) as { puzzle: { status: string } };
    assert(createdPuzzleData.puzzle.status === 'SCHEDULED', 'Shranjena uganka mora dobiti status SCHEDULED (US-11 AC #3)');

    const conflictPuzzleRes = await fetch(`${baseUrl}/api/admin/puzzles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Duplicate Date Test',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Physics',
        difficulty: 'MEDIUM',
        releaseDate: scheduleDate
      })
    });
    assert(conflictPuzzleRes.status === 409, 'Podvojen datum v koledarju mora vrniti 409 Conflict (US-11 AC #2)');

    // Admin self-demotion protection (US-15 AC #4)
    const selfDemoteRes = await fetch(`${baseUrl}/api/admin/users/${adminLoginData.user.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'PLAYER' })
    });
    assert(
      selfDemoteRes.status === 400,
      'Administrator si ne sme sam odvzeti administratorskih pravic (US-15 AC #4)'
    );
    console.log('   ✅ RBAC, SSRF zaščita, uredniški koledar in zaščita pred samo-odvzemom ADMIN vloge potrjeni.');

    console.log('\n🎉 VSI POGOJI SPREJEMLJIVOSTI (US-01 do US-15) IN VARNOSTNI PREGLEDI SO USPEŠNO PRESTANI!');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runAcceptanceTests().catch((err) => {
  console.error('❌ Preverjanje pogojev sprejemljivosti ni uspelo:', err);
  process.exit(1);
});
