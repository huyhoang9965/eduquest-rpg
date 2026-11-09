const fs = require('fs');
const content = fs.readFileSync('public/rpg.html', 'utf8');
console.log('File length:', content.length);

const babelMatch = content.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!babelMatch) {
  console.error('No Babel script found!');
  process.exit(1);
}

const s = babelMatch[1];
console.log('Babel script length:', s.length);

let cur = 0, brk = 0, par = 0;
for (let i = 0; i < s.length; i++) {
  if (s[i] === '{') cur++;
  else if (s[i] === '}') cur--;
  else if (s[i] === '[') brk++;
  else if (s[i] === ']') brk--;
  else if (s[i] === '(') par++;
  else if (s[i] === ')') par--;
}
console.log('Bracket balance check: {}:', cur, '[]:', brk, '():', par);

if (cur !== 0 || brk !== 0 || par !== 0) {
  console.error('Bracket imbalance detected!');
  process.exit(1);
} else {
  console.log('All brackets balanced perfectly!');
}
