from pathlib import Path
h=Path("index.html"); w=Path("service-worker.js")
html=h.read_text(encoding="utf-8")
sw=w.read_text(encoding="utf-8")
assert 'content="16.9.4"' in html
tag='<script defer src="./vc-delete-entry-v1694.js"></script>'
assert html.rstrip().endswith('</html>')
if tag not in html:
    index=html.rfind('</body>')
    assert index>0
    html=html[:index]+tag+'\n'+html[index:]
asset="'./vc-delete-entry-v1694.js'"
if asset not in sw:
    anchor="'./vc-reopen-entry-v1694.js'"
    assert anchor in sw
    sw=sw.replace(anchor,anchor+','+asset,1)
h.write_text(html,encoding="utf-8")
w.write_text(sw,encoding="utf-8")
print('Deletion button and required PWA asset added.')
