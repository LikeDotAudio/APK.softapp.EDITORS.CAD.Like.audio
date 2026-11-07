// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * 🧱 BLOCKS PALETTE, DRAGGED AND DROPPED IN HEADLESS CHROME (ROAD-3577), against a REAL BIM:
 * DATABASE.server.BIM's server.py on two free ports (8150's API, 8160's library app + socket)
 * over a two-part library and a fresh state dir. This script's own server serves a built dist/
 * and stands in for the gateway: /api/bim/* is proxied to that 8150. It fails unless:
 *   - a project imported through the gateway shows its instances in 📦 Project · unplaced;
 *   - dragging an instance onto the sheet places its BIM block carrying its ref AND its occurrence,
 *     and BIM (8150) then holds it assigned to this drawing + sheet; the row leaves the list;
 *   - an assignment written by someone else reaches the palette over the 8160 socket;
 *   - removing the block (the Flow tool's Ctrl-click) frees the instance in BIM, and it is back in the list;
 *   - a 📚 Library row drags in as a bare part (no occurrence).
 *
 *   node scripts/blocks-palette-headless.mjs [dist] [out.png]
 *
 * Needs puppeteer (the monorepo root has it; or PUPPETEER=<path>), Chrome (CHROME=<path>, else
 * /usr/bin/google-chrome), python3, and DATABASE.server.BIM beside this tree (BIM_SRC=<path>).
 */
import { createServer, request } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import net from 'node:net';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(process.argv[2] ?? join(ROOT, 'dist'));
const OUT = resolve(process.argv[3] ?? join(tmpdir(), 'blocks-palette.png'));
const BIM_SRC = resolve(process.env.BIM_SRC ?? join(ROOT, '../../../../POD.database/DATABASE.server.BIM/SRC'));
const DRAWING = join(ROOT, 'src/io/ifc/fixtures/keithley--2400.ifc');

const findPuppeteer = () => {
  const tries = [process.env.PUPPETEER, join(ROOT, 'node_modules/puppeteer'), join(ROOT, '../../../../../node_modules/puppeteer')].filter(Boolean);
  for (const t of tries) if (existsSync(t)) return createRequire(import.meta.url).resolve(t);
  throw new Error('no puppeteer: set PUPPETEER=<path to node_modules/puppeteer>');
};
const puppeteer = (await import(pathToFileURL(findPuppeteer()).href)).default;
const freePort = () => new Promise((ok) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => ok(p)); }); });

// ---- a real BIM over a two-part library
const work = mkdtempSync(join(tmpdir(), 'blocks-palette-'));
const lib = join(work, 'lib');
mkdirSync(lib);
execFileSync('python3', ['-c', `
import json, sys
from pathlib import Path
sys.path.insert(0, ${JSON.stringify(BIM_SRC)})
from bim import part as P
root = Path(${JSON.stringify(lib)})
for maker, model, cat, ports in [("acme", "Mixer 8", "Audio", [{"group": "IN", "side": "input", "count": 2}, {"group": "OUT", "side": "output"}]),
                                 ("acme", "Amp 2", "Amplifier", [{"group": "IN", "side": "input"}])]:
    (root / maker).mkdir(exist_ok=True)
    (root / maker / "_maker.json").write_text(json.dumps({"id": maker, "name": maker.title()}))
    part = {"id": f"{maker}/{P.slug(model)}", "maker": maker, "manufacturer": maker.title(), "model": model, "category": cat, "ports": ports}
    (root / maker / f"{P.slug(model)}.bim.json").write_text(json.dumps(P.normalise(part)))
`]);
const seed = join(work, 'seed.bench.json');
writeFileSync(seed, JSON.stringify({ schema: 'apk.bim.bench/1', name: 'Bench', instances: [], connections: [] }));
const [apiPort, appPort] = [await freePort(), await freePort()];
const bim = spawn('python3', ['-m', 'bim.server', '--library', lib, '--host', '127.0.0.1', '--port', String(apiPort)], {
  cwd: BIM_SRC, env: { ...process.env, APK_BIM_STATE: join(work, 'state'), APK_BIM_BENCH_SEED: seed, APK_BIM_LIBRARY_PORT: String(appPort),
                       APK_BIM_BROKER: '', APK_BIM_DISCOVERY: '' }, stdio: ['ignore', 'inherit', 'inherit'] });
const W = `http://127.0.0.1:${apiPort}/api/bim`;
const R = `http://127.0.0.1:${appPort}`;
const http = async (method, url, body) => {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${R}/api/bim/health`)).ok && (await fetch(`${W}/health`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 150));
}

// ---- the page, and a stand-in gateway for /api/bim
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' };
const server = createServer((req, res) => {
  if (req.url.startsWith('/api/bim/')) {
    const up = request({ host: '127.0.0.1', port: apiPort, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    req.pipe(up);
    return;
  }
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = join(DIST, p === '/' ? 'index.html' : p);
  if (!f.startsWith(DIST) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/index.html`;

let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  // the project, imported through the gateway (as the palette's ⇪ Import does)
  const imp = await http('PUT', `http://127.0.0.1:${server.address().port}/api/bim/projects/stadium`, { name: 'Stadium', devices: [
    { make: 'Acme', model: 'Mixer 8', name: 'FOH mixer', location: 'FOH' },
    { make: 'Acme', model: 'Amp 2', name: 'Stage amp', location: 'Stage left' },
    { make: 'Nobody', model: 'X-1', name: 'Mystery box', location: 'Rack B' }] });
  check(imp.status === 200 && imp.body.total === 3 && imp.body.unresolved === 1, `import through the gateway: ${imp.status} ${imp.body?.total} devices, ${imp.body?.unresolved} unresolved`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 900 });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.evaluateOnNewDocument((lib) => {
    localStorage.setItem('cad.bimLibraryUrl', lib);
    localStorage.setItem('cad.blocksProject', 'stadium');
  }, `${R}/library`);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.keyboard.press('Escape'); // the welcome card
  const input = await page.waitForSelector('input[type=file][accept=".ifc,.json"]');
  await input.uploadFile(DRAWING);   // a NAMED drawing: what is placed on it is tracked
  await page.waitForFunction(() => /Opened keithley--2400\.ifc/.test(document.body.innerText), { timeout: 30000 });
  await page.waitForSelector('.blocks-palette[data-drawing]:not([data-drawing=""])', { timeout: 10000 });
  const drawing = await page.$eval('.blocks-palette', (e) => e.getAttribute('data-drawing'));
  console.log(`     the drawing is named ${drawing}`);

  await page.waitForSelector('.blocks-palette .blocks-instance[data-instance="D1"]', { timeout: 15000 });
  const rows = await page.$$eval('.blocks-instance', (els) => els.map((e) => e.getAttribute('data-instance')));
  check(rows.join() === 'D1,D2,D3', `📦 Project · unplaced lists the project's instances: ${rows}`);
  const counts = await page.$eval('.blocks-counts', (e) => e.innerText);
  check(/Audio · 0 placed · 1 available/.test(counts), 'counts per category: Audio 0 placed · 1 available');

  // drag D1 onto the sheet
  const before = await page.$$eval('[data-placement]', (e) => e.length).catch(() => 0);
  const dropped = await page.evaluate(() => {
    const row = document.querySelector('.blocks-instance[data-instance="D1"]');
    const canvas = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const r = canvas.getBoundingClientRect();
    const dt = new DataTransfer();
    row.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    const at = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true, dataTransfer: dt };
    canvas.dispatchEvent(new DragEvent('dragover', at));
    canvas.dispatchEvent(new DragEvent('drop', at));
    return dt.getData('application/x-apk-bim');
  });
  const payload = JSON.parse(dropped);
  check(payload.bim?.id === 'acme/mixer-8' && payload.ref?.part === 'acme/mixer-8' && /^[0-9A-Za-z_$]{22}$/.test(payload.occurrence?.globalId ?? ''),
    `the row drags {bim, ref, occurrence}: ${payload.bim?.id}, GlobalId ${payload.occurrence?.globalId}`);
  await page.waitForFunction(() => !document.querySelector('.blocks-instance[data-instance="D1"]'), { timeout: 10000 }).catch(() => {});
  let v = (await http('GET', `${W}/projects/stadium?drawing=${encodeURIComponent(drawing)}`)).body;
  const d1 = v.instances.find((i) => i.id === 'D1');
  check(d1.assigned?.drawing === drawing && d1.assigned?.sheet === 'Model', `BIM holds D1 placed on ${d1.assigned?.drawing} · ${d1.assigned?.sheet}`);
  check(v.by_category.Audio.here === 1 && v.placed === 1, `BIM counts: ${v.placed} placed, Audio here ${v.by_category.Audio.here}`);
  check(!(await page.$('.blocks-instance[data-instance="D1"]')), 'D1 left 📦 Project · unplaced');
  await page.click('.blocks-tab[data-tab="drawing"]');
  await page.waitForSelector('.blocks-here-row', { timeout: 5000 }).catch(() => {});
  const here = await page.$$eval('.blocks-here-row', (els) => els.map((e) => e.innerText));
  check(here.some((t) => /FOH mixer/.test(t) && /stadium\/D1/.test(t)), `📄 This drawing shows it: ${here.join(' | ').replace(/\n/g, ' ')}`);

  // someone else places D2 elsewhere: the socket brings it here
  await page.click('.blocks-tab[data-tab="project"]');
  await http('PUT', `${W}/projects/stadium/assignments/D2`, { drawing: 'Stage.dxf', sheet: 'A1' });
  const pushed = await page.waitForFunction(() => !document.querySelector('.blocks-instance[data-instance="D2"]')
    && /1 on other drawings/.test(document.body.innerText), { timeout: 10000 }).then(() => true, () => false);
  check(pushed, 'an assignment written elsewhere reached the palette over the 8160 socket');
  await page.screenshot({ path: OUT });
  console.log(`shot ${OUT}`);

  // remove the block (Flow tool, Ctrl-click on it): BIM frees D1
  const box = await page.evaluate(() => { const r = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0].getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(box.x, box.y);
  await page.keyboard.press('f');
  await page.keyboard.down('Control'); await page.mouse.click(box.x, box.y); await page.keyboard.up('Control');
  const freed = await page.waitForFunction(() => !!document.querySelector('.blocks-instance[data-instance="D1"]'), { timeout: 10000 }).then(() => true, () => false);
  v = (await http('GET', `${W}/projects/stadium`)).body;
  check(freed && !v.instances.find((i) => i.id === 'D1').assigned, 'removing the block freed D1 in BIM and it is back in the list');

  // a 📚 Library row: a bare part
  await page.click('.blocks-tab[data-tab="library"]');
  await page.waitForSelector('.blocks-part[data-part="acme/amp-2"]', { timeout: 10000 });
  const lib2 = await page.evaluate(() => {
    const row = document.querySelector('.blocks-part[data-part="acme/amp-2"]');
    const dt = new DataTransfer();
    row.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    return JSON.parse(dt.getData('application/x-apk-bim'));
  });
  check(lib2.bim?.id === 'acme/amp-2' && lib2.ref?.part === 'acme/amp-2' && !lib2.occurrence, '📚 Library rows drag a bare part with its ref');
} finally {
  await browser.close();
  server.close();
  bim.kill();
}
process.exit(failed ? 1 : 0);
