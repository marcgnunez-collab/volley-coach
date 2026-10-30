from pathlib import Path
import re

html_path=Path('index.html')
sw_path=Path('service-worker.js')
html=html_path.read_text(encoding='utf-8')
sw=sw_path.read_text(encoding='utf-8')
assert 'name="volley-coach-build" content="16.9.3"' in html
assert html.count('</body>') == 1
assert 'src="./vc-sync-v1693.js"' in html
assert 'src="./vc-reopen-safe-v1694.js"' not in html
assert "const BUILD='16.9.3';" in sw
assert "const CACHE_NAME='volley-coach-v16.9.3-stable-pwa';" in sw
assert "'./vc-sync-v1693.js'" in sw
assert "vc-reopen-safe-v1694.js" not in sw
html=html.replace('name="volley-coach-build" content="16.9.3"',
                  'name="volley-coach-build" content="16.9.4"',1)
html=html.replace('</body>', '<script defer src="./vc-reopen-safe-v1694.js"></script>\n<script defer src="./vc-reopen-entry-v1694.js"></script>\n</body>',1)
sw=sw.replace("const BUILD='16.9.3';","const BUILD='16.9.4';",1)
sw=sw.replace("const CACHE_NAME='volley-coach-v16.9.3-stable-pwa';",
              "const CACHE_NAME='volley-coach-v16.9.4-stable-pwa';",1)
sw=sw.replace("'./vc-sync-v1693.js',","'./vc-sync-v1693.js','./vc-reopen-safe-v1694.js','./vc-reopen-entry-v1694.js',",1)
for path,content in [(html_path,html),(sw_path,sw)]:
    path.write_text(content,encoding='utf-8')
print('Staged V16.9.4 script assets and cache.')
