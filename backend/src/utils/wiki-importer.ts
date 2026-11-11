import type { PuzzleTokenPayload, TokenRecord } from '../lib/store';
import { stemWord } from './stemmer';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't", 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', "can't", 'cannot', 'could', "couldn't",
  'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', "hadn't", 'has', "hasn't", 'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's",
  'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's", 'its', 'itself',
  "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such',
  'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'upon', 'us', 'very',
  'was', "wasn't", 'we', "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's", 'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't",
  'you', "you'd", "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Varnostna validacija Wikipedia URL naslova (preprečevanje SSRF napadov).
 * Dovoli le veljavne HTTPS povezave na uradno domeno `wikipedia.org`.
 */
export function parseSafeWikipediaUrl(rawUrl: string): { host: string; titleSlug: string } | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return null;
    if (!/^[a-z]{2,3}\.wikipedia\.org$/i.test(parsed.hostname)) return null;
    if (!parsed.pathname.startsWith('/wiki/')) return null;

    const slug = decodeURIComponent(parsed.pathname.slice(6)).trim();
    if (!slug || slug.includes('..') || slug.includes('/')) return null;

    return {
      host: parsed.hostname.toLowerCase(),
      titleSlug: slug
    };
  } catch {
    return null;
  }
}

export function cleanWikipediaExtract(rawExtract: string): Array<{ heading: string | null; paragraphs: string[] }> {
  // Odstrani morebitne ostanke HTML značk ali referenc [1], [2]
  const stripped = rawExtract
    .replace(/<[^>]*>/g, '')
    .replace(/\[\d+\]/g, '');

  const ignoreSections = [
    'see also', 'references', 'further reading', 'external links', 'notes',
    'bibliography', 'citations', 'sources', 'glej tudi', 'sklici', 'viri'
  ];

  const lines = stripped.split('\n');
  const sections: Array<{ heading: string | null; paragraphs: string[] }> = [];
  let currentHeading: string | null = null;
  let currentParagraphs: string[] = [];
  let skipping = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

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
    if (line.length > 15) {
      currentParagraphs.push(line);
    }
  }

  if (currentParagraphs.length > 0) {
    sections.push({ heading: currentHeading, paragraphs: currentParagraphs });
  }

  return sections.slice(0, 4);
}

export function tokenizeRawText(
  text: string,
  counter: { count: number },
  isTitle = false
): TokenRecord[] {
  const regex = /([a-zA-Z0-9]+(?:'[a-zA-Z]+)?)|([^a-zA-Z0-9\s]+)|(\s+)/g;
  const tokens: TokenRecord[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    if (match[1]) {
      const clean = match[1].toLowerCase();
      const isStop = STOP_WORDS.has(clean);
      const stem = stemWord(clean);
      tokens.push({
        id: counter.count++,
        type: 'word',
        text: raw,
        canonical: clean,
        stem,
        length: raw.length,
        isStopWord: isStop,
        isTitle,
        isRevealed: isStop
      });
    } else if (match[2]) {
      tokens.push({
        id: counter.count++,
        type: 'punct',
        text: raw,
        isRevealed: true
      });
    } else if (match[3]) {
      tokens.push({
        id: counter.count++,
        type: 'space',
        text: raw,
        isRevealed: true
      });
    }
  }

  return tokens;
}

export function buildTokenPayloadFromText(title: string, rawExtract: string): {
  summaryLead: string;
  tokenData: PuzzleTokenPayload;
  totalTokensCount: number;
  stopWordsCount: number;
} {
  const sectionsData = cleanWikipediaExtract(rawExtract);
  const counter = { count: 0 };

  const titleTokens = tokenizeRawText(title, counter, true);
  const structuredSections = sectionsData.map(sec => ({
    heading: sec.heading
      ? {
          text: sec.heading,
          tokens: tokenizeRawText(sec.heading, counter, false)
        }
      : null,
    paragraphs: sec.paragraphs.map(p => ({
      tokens: tokenizeRawText(p, counter, false)
    }))
  }));

  let totalWords = 0;
  let hiddenWords = 0;
  let stopWordsCount = 0;
  const titleWords: string[] = [];

  for (const t of titleTokens) {
    if (t.type === 'word') {
      totalWords++;
      if (t.isStopWord) stopWordsCount++;
      else {
        hiddenWords++;
        if (t.canonical) titleWords.push(t.canonical);
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

  const summaryLead = sectionsData[0]?.paragraphs[0] || title;

  return {
    summaryLead,
    tokenData: {
      titleTokens,
      titleTargetWords: Array.from(new Set(titleWords)),
      sections: structuredSections,
      stats: {
        totalWords,
        hiddenWords,
        stopWordsCount,
        paragraphCount: sectionsData.reduce((acc, s) => acc + s.paragraphs.length, 0)
      }
    },
    totalTokensCount: totalWords,
    stopWordsCount
  };
}
