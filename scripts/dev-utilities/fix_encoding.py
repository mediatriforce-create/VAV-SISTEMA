import os, re

REPLACEMENTS = [
    ('Ã§Ãµes', 'ções'),
    ('Ã§Ã£o', 'ção'),
    ('Ã§Ãµ', 'çõ'),
    ('Ã§Ã¡', 'çá'),
    ('Ã‡Ãƒ', 'ÇÃ'),
    ('Ãª', 'ê'),
    ('Ã©', 'é'),
    ('Ã³', 'ó'),
    ('Ã¡', 'á'),
    ('Ãµ', 'õ'),
    ('Ã£', 'ã'),
    ('Ã­', 'í'),
    ('Ãº', 'ú'),
    ('Ã§', 'ç'),
    ('Ã¢', 'â'),
    ('Ã´', 'ô'),
    ('Ã¼', 'ü'),
    ('Ã±', 'ñ'),
    ('Ã€', 'À'),
    ('Ã‰', 'É'),
    ('Ã"', 'Ó'),
    ('Ã‡', 'Ç'),
    ('Ã³', 'ó'),
    ('Ã', 'Í'),
    ('Â°', '°'),
    ('Âº', 'º'),
    ('Â·', '·'),
    ('â€"', '—'),
    ('â€"', '–'),
    ('â€œ', '"'),
    ('â€\x9d', '"'),
    ('â€™', "'"),
    ('â€˜', "'"),
    ('Ã¶', 'ö'),
    ('Ã¤', 'ä'),
    ('Ã¸', 'ø'),
    ('Ã¥', 'å'),
    ('Ãƒ', 'Ã'),
]

src = r'c:\Users\media\OneDrive\Desktop\VAV SISTEMA\vav-central\src'
fixed = []

for root, dirs, files in os.walk(src):
    for fname in files:
        if fname.endswith(('.tsx', '.ts')):
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue
            
            original = content
            for bad, good in REPLACEMENTS:
                content = content.replace(bad, good)
            
            if content != original:
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixed.append(fname)

print(f"Fixed {len(fixed)} files:")
for f in fixed:
    print(f"  - {f}")
