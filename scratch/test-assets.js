const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

// match all /assets/... references in HTML and inline JS
const regex = /\/assets\/[a-zA-Z0-9_\-\.\/]+/g;
const matches = [...new Set(html.match(regex) || [])];

console.log(`Found ${matches.length} unique asset paths in index.html.`);

const missing = [];
matches.forEach(assetPath => {
  const diskPath = path.join(__dirname, '..', 'public', assetPath);
  if (!fs.existsSync(diskPath)) {
    missing.push(assetPath);
  } else {
    // verify file size > 0
    const stat = fs.statSync(diskPath);
    if (stat.size === 0) {
      missing.push(`${assetPath} (0 bytes)`);
    }
  }
});

if (missing.length === 0) {
  console.log('SUCCESS: All asset files exist and have non-zero size!');
} else {
  console.error('ERROR: Missing assets:', missing);
  process.exit(1);
}
