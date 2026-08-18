from pathlib import Path

p = Path('index.html')
if not p.exists():
    raise SystemExit('Run this script from the B4NCRM repository root (index.html not found).')

html = p.read_text(encoding='utf-8')
css = '  <link rel="stylesheet" href="executive-crm-dashboard.css" />\n'
js = '  <script src="executive-crm-dashboard.js"></script>\n'

if 'executive-crm-dashboard.css' not in html:
    marker = '  <link rel="stylesheet" href="salon-user-intelligence.css" />\n'
    if marker not in html:
        marker = '</head>'
        html = html.replace(marker, css + marker, 1)
    else:
        html = html.replace(marker, marker + css, 1)

if 'executive-crm-dashboard.js' not in html:
    marker = '<script src="salon-user-intelligence.js"></script>'
    if marker in html:
        html = html.replace(marker, marker + '\n' + js.rstrip(), 1)
    else:
        html = html.replace('</body>', js + '</body>', 1)

p.write_text(html, encoding='utf-8')
print('B4NCRM Executive Dashboard v1 installed into index.html')
