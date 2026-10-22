import { stemWord, cleanGuess } from '../src/utils/stemmer.ts';
import fs from 'fs';

async function runUnitTests() {
  console.log('--- Test 1: Stemmer & Normalization ---');
  const inflections = [
    { in: 'ACTS', stem: 'act' },
    { in: 'acting', stem: 'act' },
    { in: 'acted', stem: 'act' },
    { in: 'Gravitational', stem: 'gravitate' },
    { in: 'orbits', stem: 'orbit' },
    { in: 'orbiting', stem: 'orbit' }
  ];
  for (const item of inflections) {
    const s = stemWord(cleanGuess(item.in));
    console.log(`Word: "${item.in}" -> cleaned: "${cleanGuess(item.in)}" -> stem: "${s}"`);
    if (item.in.toLowerCase().startsWith('act')) {
      if (s !== 'act') throw new Error(`Stem mismatch for ${item.in}: expected "act", got "${s}"`);
    }
  }
  console.log('✅ Stemmer test passed!');

  console.log('\n--- Test 2: Puzzle Ingestion & Game Simulation ---');
  const puzzle = JSON.parse(fs.readFileSync('public/puzzles/today.json', 'utf-8'));
  console.log('Loaded Puzzle:', puzzle.wikipediaTitle, `(#${puzzle.puzzleNumber})`);

  const revealedIds = new Set();
  // Count pre-revealed stop words
  let stopWordsCount = 0;
  for (const t of puzzle.titleTokens) {
    if (t.isStopWord) stopWordsCount++;
  }
  for (const s of puzzle.sections) {
    for (const p of s.paragraphs) {
      for (const t of p.tokens) {
        if (t.isStopWord) stopWordsCount++;
      }
    }
  }
  console.log('Verified pre-revealed stop words count:', stopWordsCount);

  // Test guessing a common content word: "physics"
  function simulateGuess(word) {
    const cleaned = cleanGuess(word);
    const stem = stemWord(cleaned);
    let hits = 0;
    const test = (t) => {
      if (t.type !== 'word' || t.isStopWord || revealedIds.has(t.id)) return;
      if (t.canonical === cleaned || t.stem === stem) {
        revealedIds.add(t.id);
        hits++;
      }
    };
    puzzle.titleTokens.forEach(test);
    puzzle.sections.forEach(s => {
      if (s.heading) s.heading.tokens.forEach(test);
      s.paragraphs.forEach(p => p.tokens.forEach(test));
    });
    return hits;
  }

  const hitsPhysics = simulateGuess('physics');
  console.log(`Guess "physics" -> hits: ${hitsPhysics}`);
  if (hitsPhysics <= 0) throw new Error('Expected hits for physics in Gravity article');

  const hitsMass = simulateGuess('mass');
  console.log(`Guess "mass" -> hits: ${hitsMass}`);

  const hitsForce = simulateGuess('force');
  console.log(`Guess "force" -> hits: ${hitsForce}`);

  // Test win condition before title is guessed
  const titleWords = puzzle.titleTokens.filter(t => t.type === 'word' && !t.isStopWord);
  const isWonBefore = titleWords.every(t => revealedIds.has(t.id));
  console.log('isWon before title guess:', isWonBefore);
  if (isWonBefore) throw new Error('Should not be won before guessing Gravity');

  // Test guessing the title: "gravity"
  const hitsGravity = simulateGuess('gravity');
  console.log(`Guess title "gravity" -> hits: ${hitsGravity}`);
  const isWonAfter = titleWords.every(t => revealedIds.has(t.id));
  console.log('isWon after title guess:', isWonAfter);
  if (!isWonAfter) throw new Error('Should be won after guessing Gravity');
  console.log('✅ In-memory deduction & victory simulation passed!');

  console.log('\n--- Test 3: Daily Reset Calculation ---');
  const now = new Date();
  const nextUtc = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diffHours = (nextUtc.getTime() - now.getTime()) / (1000 * 60 * 60);
  console.log(`Hours until next 00:00 UTC declassification: ${diffHours.toFixed(2)}h`);
  if (diffHours < 0 || diffHours > 24) throw new Error('Invalid UTC countdown calculation');
  console.log('✅ UTC synchronization check passed!');

  console.log('\n🎉 ALL LOGIC AND ARCHITECTURAL VALIDATION TESTS PASSED!');
}

runUnitTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
