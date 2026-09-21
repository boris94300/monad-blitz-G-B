// Broken-link checker: node scripts/check-links.mjs [baseUrl]
// Crawls the public pages, follows every internal link and checks external ones (external failures are warnings).
const base = (process.argv[2] || process.env.E2E_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const headers = base.startsWith('http://localhost') ? {'x-forwarded-proto': 'https'} : {};
const seeds = ['/', '/cgu', '/confidentialite', '/setup'];
const seen = new Set(), external = new Set(), broken = [];
const queue = [...seeds];
const hrefs = html => [...html.matchAll(/<a\s[^>]*href="([^"#][^"]*)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue; seen.add(path);
  const res = await fetch(base + path, {headers, redirect: 'manual'}).catch(e => ({status: 0, error: e}));
  if (res.status >= 400 || res.status === 0) { broken.push(`${path} → ${res.status}`); continue; }
  if (!String(res.headers?.get('content-type') || '').includes('text/html')) continue;
  const html = await res.text();
  if (path === '/') for (const id of ['concept', 'join', 'contenu']) if (!html.includes(`id="${id}"`)) broken.push(`ancre #${id} absente de /`);
  for (const href of hrefs(html)) {
    if (/^(mailto:|tel:)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) { if (!href.startsWith(base)) external.add(href); else queue.push(href.slice(base.length) || '/'); }
    else if (href.startsWith('/')) queue.push(href.split('#')[0] || '/');
  }
}
const warnings = [];
for (const url of external) {
  const ok = await fetch(url, {method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10000), headers: {'user-agent': 'Mozilla/5.0 link-check'}}).then(r => r.status < 400).catch(() => false);
  if (!ok) warnings.push(url);
}
console.log(`${seen.size} pages internes vérifiées, ${external.size} liens externes testés.`);
if (warnings.length) console.warn('Liens externes injoignables (à vérifier) :\n' + warnings.map(u => ' - ' + u).join('\n'));
if (broken.length) { console.error('Liens cassés :\n' + broken.map(b => ' - ' + b).join('\n')); process.exit(1); }
console.log('Aucun lien interne cassé.');
