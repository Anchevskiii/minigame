/**
 * Strežniški Porter Stemmer in normalizator besed (skladno s src/utils/stemmer.ts in US-01).
 */
export function stemWord(w: string): string {
  let word = w.toLowerCase().trim();
  if (word.length < 3) return word;

  if (word.endsWith('sses')) word = word.slice(0, -2);
  else if (word.endsWith('ies')) word = word.slice(0, -2);
  else if (word.endsWith('ss')) {
    // ohrani 'ss'
  } else if (word.endsWith('s')) word = word.slice(0, -1);

  if (word.endsWith('eed')) {
    if (word.length > 4) word = word.slice(0, -1);
  } else if (
    (word.endsWith('ed') || word.endsWith('ing')) &&
    /[aeiou]/.test(word.slice(0, -3))
  ) {
    if (word.endsWith('ed')) word = word.slice(0, -2);
    else if (word.endsWith('ing')) word = word.slice(0, -3);

    if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) word += 'e';
    else if (/(bb|dd|ff|gg|mm|nn|pp|rr|tt)$/.test(word) && !/(ll|ss|zz)$/.test(word)) {
      word = word.slice(0, -1);
    }
  }

  if (word.endsWith('y') && /[bcdfghjklmnpqrstvwxz]/.test(word.slice(-2, -1))) {
    word = word.slice(0, -1) + 'i';
  }

  const suffixes: [string, string][] = [
    ['ational', 'ate'],
    ['tional', 'tion'],
    ['enci', 'ence'],
    ['anci', 'ance'],
    ['izer', 'ize'],
    ['alli', 'al'],
    ['entli', 'ent'],
    ['eli', 'e'],
    ['ousli', 'ous'],
    ['ization', 'ize'],
    ['ation', 'ate'],
    ['ator', 'ate'],
    ['alism', 'al'],
    ['iveness', 'ive'],
    ['fulness', 'ful'],
    ['ousness', 'ous'],
    ['aliti', 'al'],
    ['iviti', 'ive'],
    ['biliti', 'ble']
  ];

  for (const [suf, rep] of suffixes) {
    if (word.endsWith(suf)) {
      word = word.slice(0, -suf.length) + rep;
      break;
    }
  }

  return word;
}

export function cleanGuess(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .trim();
}
