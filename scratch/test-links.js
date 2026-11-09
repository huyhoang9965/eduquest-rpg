const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

const anchorRegex = /href="#([a-zA-Z0-9_\-]+)"/g;
const anchors = [...new Set([...html.matchAll(anchorRegex)].map(m => m[1]))];

console.log('Testing anchors:', anchors);
anchors.forEach(id => {
  const hasId = html.includes(`id="${id}"`);
  console.log(`- Anchor #${id}: ${hasId ? 'FOUND' : 'MISSING!'}`);
  if (!hasId) process.exit(1);
});

const pageRegex = /href="\/([a-zA-Z0-9_\-\.]+)(?:\?[^"]*)?"/g;
const pages = [...new Set([...html.matchAll(pageRegex)].map(m => m[1]))];
console.log('Testing pages:', pages);
pages.forEach(p => {
  const filePath = path.join(__dirname, '..', 'public', p);
  const exists = fs.existsSync(filePath);
  console.log(`- Page /${p}: ${exists ? 'EXISTS' : 'NOT FOUND!'}`);
  if (!exists) process.exit(1);
});

console.log('ALL ANCHORS AND PAGES VERIFIED 100%!');
