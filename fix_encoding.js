const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
    ['Ã§Ãµes', 'ções'],
    ['Ã§Ã£o', 'ção'],
    ['Ã§Ãµ', 'çõ'],
    ['Ã§Ã¡', 'çá'],
    ['Ã‡ÃƒO', 'ÇÃO'],
    ['Ãª', 'ê'],
    ['Ã©', 'é'],
    ['Ã³', 'ó'],
    ['Ã¡', 'á'],
    ['Ãµ', 'õ'],
    ['Ã£', 'ã'],
    ['Ã­', 'í'],
    ['Ãº', 'ú'],
    ['Ã§', 'ç'],
    ['Ã¢', 'â'],
    ['Ã´', 'ô'],
    ['Ã¼', 'ü'],
    ['Ã±', 'ñ'],
    ['Ã€', 'À'],
    ['Ã‰', 'É'],
    ['Ã"', 'Ó'],
    ['Ã‡', 'Ç'],
    ['Âº', 'º'],
    ['Â°', '°'],
    ['â€"', '—'],
    ['â€œ', '"'],
    ['â€\x9d', '"'],
    ['â€™', "'"],
    ['â€˜', "'"],
    ['Ãƒ', 'Ã'],
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                results = results.concat(walk(filePath));
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(filePath);
        }
    }
    return results;
}

const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);
let fixedCount = 0;

for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    for (const [bad, good] of REPLACEMENTS) {
        while (content.includes(bad)) {
            content = content.split(bad).join(good);
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        fixedCount++;
        console.log('FIXED: ' + path.basename(filePath));
    }
}

console.log(`\nDone. Fixed ${fixedCount} files.`);
