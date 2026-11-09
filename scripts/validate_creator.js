const fs = require('fs');

const content = fs.readFileSync('public/creator.html', 'utf8');
const babelMatch = content.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

if (!babelMatch) {
  console.error("Could not find babel script in public/creator.html");
  process.exit(1);
}

const code = babelMatch[1];
console.log("Creator script length:", code.length);

const counts = { '{': 0, '}': 0, '[': 0, ']': 0, '(': 0, ')': 0 };
for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  if (counts[ch] !== undefined) {
    counts[ch]++;
  }
}

const diffCurly = counts['{'] - counts['}'];
const diffSquare = counts['['] - counts[']'];
const diffParen = counts['('] - counts[')'];

console.log(`Bracket balance check: {}: ${diffCurly} []: ${diffSquare} (): ${diffParen}`);

if (diffCurly !== 0 || diffSquare !== 0 || diffParen !== 0) {
  console.error("ERROR: Bracket imbalance detected!");
  process.exit(1);
} else {
  console.log("All brackets in creator.html balanced perfectly!");
}
