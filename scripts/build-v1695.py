from pathlib import Path
h=Path('index.html');sw=Path('service-worker.js')
html=h.read_text(encoding='utf-8');worker=sw.read_text(encoding='utf-8')
assert 'name="volley-coach-build" content="16.9.4"' in html
assert "const BUILD='16.9.4';" in worker
assert html.rstrip().endswith('</html>')
assert 'src="./vc-sync-v1693.js"' in html
assert 'src="./vc-scout-management-v1695.js"' not in html
html=html.replace('name="volley-coach-build" content="16.9.4"','name="volley-coach-build" content="16.9.5"',1)
head,sep,tail=html.rpartition('</body>')
assert sep and tail.strip()=='</html>'
html=head+'<script defer src="./vc-scout-management-v1695.js"></script>\n</body>'+tail
worker=worker.replace("const BUILD='16.9.4';","const BUILD='16.9.5';",1)
worker=worker.replace("const CACHE_NAME='volley-coach-v16.9.4-stable-pwa';","const CACHE_NAME='volley-coach-v16.9.5-stable-pwa';",1)
assert "'./vc-sync-v1693.js'" in worker
worker=worker.replace("'./vc-sync-v1693.js'","'./vc-sync-v1693.js','./vc-scout-management-v1695.js'",1)
h.write_text(html,encoding='utf-8')
sw.write_text(worker,encoding='utf-8')
print('Installed Gestión Scoutings into V16.9.5 candidate.')

# Candidate build is isolated from main.
