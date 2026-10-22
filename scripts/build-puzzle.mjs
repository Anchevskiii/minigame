import fs from 'fs';
import path from 'path';

// Standard English stop words pre-revealed in REDACTED
export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each',
  'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'upon', 'us',
  'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

export function stemWord(w) {
  let word = w.toLowerCase().trim();
  if (word.length < 3) return word;

  if (word.endsWith('sses')) word = word.slice(0, -2);
  else if (word.endsWith('ies')) word = word.slice(0, -2);
  else if (word.endsWith('ss')) {}
  else if (word.endsWith('s')) word = word.slice(0, -1);

  if (word.endsWith('eed')) {
    if (word.length > 4) word = word.slice(0, -1);
  } else if ((word.endsWith('ed') || word.endsWith('ing')) && /[aeiou]/.test(word.slice(0, -3))) {
    if (word.endsWith('ed')) word = word.slice(0, -2);
    else if (word.endsWith('ing')) word = word.slice(0, -3);
    
    if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) word += 'e';
    else if (/(bb|dd|ff|gg|mm|nn|pp|rr|tt)$/.test(word) && !/(ll|ss|zz)$/.test(word)) word = word.slice(0, -1);
  }

  if (word.endsWith('y') && /[bcdfghjklmnpqrstvwxz]/.test(word.slice(-2, -1))) {
    word = word.slice(0, -1) + 'i';
  }

  const suffixes = [
    ['ational', 'ate'], ['tional', 'tion'], ['enci', 'ence'], ['anci', 'ance'],
    ['izer', 'ize'], ['alli', 'al'], ['entli', 'ent'], ['eli', 'e'],
    ['ousli', 'ous'], ['ization', 'ize'], ['ation', 'ate'], ['ator', 'ate'],
    ['alism', 'al'], ['iveness', 'ive'], ['fulness', 'ful'], ['ousness', 'ous'],
    ['aliti', 'al'], ['iviti', 'ive'], ['biliti', 'ble']
  ];
  for (const [suf, rep] of suffixes) {
    if (word.endsWith(suf)) {
      word = word.slice(0, -suf.length) + rep;
      break;
    }
  }

  return word;
}

export function cleanCleanText(rawExtract) {
  const ignoreSections = [
    'see also', 'references', 'further reading', 'external links', 'notes',
    'bibliography', 'citations', 'sources'
  ];

  const rawBlocks = rawExtract.split('\n');
  const sections = [];
  let currentHeading = null;
  let currentParagraphs = [];
  let skipping = false;

  for (let line of rawBlocks) {
    line = line.trim();
    if (!line) continue;

    // Check if section header, e.g. == Overview == or === Subsection ===
    const headingMatch = line.match(/^(={2,5})\s*(.+?)\s*\1$/);
    if (headingMatch) {
      const headingTitle = headingMatch[2].trim();
      if (ignoreSections.includes(headingTitle.toLowerCase())) {
        skipping = true;
        continue;
      }
      skipping = false;

      if (currentParagraphs.length > 0) {
        sections.push({ heading: currentHeading, paragraphs: [...currentParagraphs] });
        currentParagraphs = [];
      }
      currentHeading = headingTitle;
      continue;
    }

    if (skipping) continue;

    // Filter out very short or metadata lines
    if (line.length > 15) {
      currentParagraphs.push(line);
    }
  }

  if (currentParagraphs.length > 0) {
    sections.push({ heading: currentHeading, paragraphs: currentParagraphs });
  }

  return sections;
}

// Tokenizes a string into words and non-word delimiters (spaces, punctuation)
export function tokenizeText(text, globalTokenIndex, isTitle = false) {
  const regex = /([a-zA-Z0-9]+(?:'[a-zA-Z]+)?)|([^a-zA-Z0-9\s]+)|(\s+)/g;
  const tokens = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    if (match[1]) {
      // Word token
      const clean = match[1].toLowerCase();
      const isStop = STOP_WORDS.has(clean);
      const stem = stemWord(clean);
      tokens.push({
        id: globalTokenIndex.count++,
        type: 'word',
        text: raw,
        canonical: clean,
        stem: stem,
        length: raw.length,
        isStopWord: isStop,
        isTitle: isTitle,
        isRevealed: isStop
      });
    } else if (match[2]) {
      // Punctuation
      tokens.push({
        id: globalTokenIndex.count++,
        type: 'punct',
        text: raw,
        isRevealed: true
      });
    } else if (match[3]) {
      // Whitespace
      tokens.push({
        id: globalTokenIndex.count++,
        type: 'space',
        text: raw,
        isRevealed: true
      });
    }
  }

  return tokens;
}

export async function buildPuzzleFromWiki(title, puzzleNumber, releaseDateUtc) {
  console.log(`[Builder] Fetching article "${title}" from Wikipedia...`);
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'RedactedMinigame/1.0 (educational/game project; contact@example.com)' }
  });
  const data = await res.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  const page = pages[pageId];
  if (!page || page.missing) {
    throw new Error(`Article not found: ${title}`);
  }

  const rawExtract = page.extract;
  const sectionsData = cleanCleanText(rawExtract);

  // Limit to lead section + first 3 major sections for optimal gameplay length
  const trimmedSections = sectionsData.slice(0, 4);

  const globalTokenIndex = { count: 0 };

  // Tokenize Title
  const titleTokens = tokenizeText(page.title, globalTokenIndex, true);

  // Tokenize Body
  const structuredSections = trimmedSections.map(sec => {
    return {
      heading: sec.heading ? {
        text: sec.heading,
        tokens: tokenizeText(sec.heading, globalTokenIndex, false)
      } : null,
      paragraphs: sec.paragraphs.map(p => ({
        tokens: tokenizeText(p, globalTokenIndex, false)
      }))
    };
  });

  // Calculate statistics
  let totalWords = 0;
  let hiddenWords = 0;
  let stopWordsCount = 0;
  const titleWords = [];

  for (const t of titleTokens) {
    if (t.type === 'word') {
      totalWords++;
      if (t.isStopWord) stopWordsCount++;
      else {
        hiddenWords++;
        titleWords.push(t.canonical);
      }
    }
  }

  for (const s of structuredSections) {
    if (s.heading) {
      for (const t of s.heading.tokens) {
        if (t.type === 'word') {
          totalWords++;
          if (t.isStopWord) stopWordsCount++;
          else hiddenWords++;
        }
      }
    }
    for (const p of s.paragraphs) {
      for (const t of p.tokens) {
        if (t.type === 'word') {
          totalWords++;
          if (t.isStopWord) stopWordsCount++;
          else hiddenWords++;
        }
      }
    }
  }

  const puzzlePayload = {
    id: `puzzle-${puzzleNumber}`,
    puzzleNumber,
    releaseDateUtc,
    wikipediaTitle: page.title,
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    stats: {
      totalWords,
      hiddenWords,
      stopWordsCount,
      paragraphCount: trimmedSections.reduce((acc, s) => acc + s.paragraphs.length, 0)
    },
    titleTokens,
    titleTargetWords: Array.from(new Set(titleWords)),
    sections: structuredSections
  };

  return puzzlePayload;
}

// Generate default daily puzzles for launch
async function main() {
  const puzzlesToGenerate = [
    { title: 'Albert Einstein', number: 1, date: '2026-10-01' },
    { title: 'Gravity', number: 2, date: '2026-10-02' },
    { title: 'Photosynthesis', number: 3, date: '2026-10-03' },
    { title: 'The Beatles', number: 4, date: '2026-10-04' },
    { title: 'Pyramid', number: 5, date: '2026-10-05' }
  ];

  const outDir = path.resolve('public/puzzles');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const p of puzzlesToGenerate) {
    const puzzle = await buildPuzzleFromWiki(p.title, p.number, p.date);
    const filePath = path.join(outDir, `puzzle-${p.number}.json`);
    fs.writeFileSync(filePath, JSON.stringify(puzzle, null, 2));
    console.log(`Generated: ${filePath} (${puzzle.stats.totalWords} words, ${puzzle.stats.hiddenWords} hidden)`);
  }

  // Also write today's puzzle (puzzle #2 Gravity) as default today.json
  const todayFile = path.join(outDir, 'today.json');
  const todayPuzzle = JSON.parse(fs.readFileSync(path.join(outDir, 'puzzle-2.json'), 'utf-8'));
  fs.writeFileSync(todayFile, JSON.stringify(todayPuzzle, null, 2));
  console.log(`Set active daily puzzle -> ${todayFile}`);
}

main().catch(console.error);
