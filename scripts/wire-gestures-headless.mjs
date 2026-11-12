// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * THE WIRE GESTURES AND THE WIRE MANAGER, FLOWN IN HEADLESS CHROME WITH REAL MOUSE EVENTS (ROAD-3689).
 *
 * Against the CAD as it is served (default :8080, the baked WEB.Frontend-Assets copy, whose
 * /api/bim answers the part): scripts/wireGesturesFixture.ts writes a drawing with this app's own
 * exporter — four of one real BIM part, W1 (two bends) U1 → U2, W2 U2 → U3, and a drawn line
 * U3 → U4 — and the flight opens it with File ▸ Open Model, finds the sheet's scale from the
 * status bar's cursor readout, then with the Select tool and the mouse only:
 *   - clicks W1 (selects it whole), slides its vertical run sideways, drags a bend;
 *   - double-clicks a run (a bend is added), double-clicks that bend (it goes);
 *   - clicks W2 and presses Delete (it goes);
 *   - opens 🧵 Wire Manager, Discovers (the drawn line is one candidate), Accepts all;
 *   - downloads the wirelist and the netlist CSVs and File ▸ Save Model's .ifc;
 * and fails unless each step left what it should (the Wire Manager's table, the downloads, and
 * the saved .ifc read back with the CAD's own importIfc). The saved .ifc is left for IfcOpenShell.
 *
 *   node scripts/wire-gestures-headless.mjs [url] [out-dir]
 *
 * Needs puppeteer (the monorepo root has it; or PUPPETEER=<path>), Chrome (CHROME=<path>, else
 * /usr/bin/google-chrome) and esbuild (this package's devDependency).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const URL_ = process.argv[2] || 'http://localhost:8080/Softapps/EDITORS/EDITORS.CAD.Like.audio/dist/index.html';
const OUT = resolve(process.argv[3] || mkdtempSync(join(tmpdir(), 'wire-gestures-')));
const PART = process.env.PART ?? 'meyer-sound/09-087-001-11';
mkdirSync(OUT, { recursive: true });
const DL = join(OUT, 'downloads');
mkdirSync(DL, { recursive: true });

const findPuppeteer = () => {
  const tries = [process.env.PUPPETEER, join(ROOT, 'node_modules/puppeteer'), join(ROOT, '../../../../../node_modules/puppeteer')].filter(Boolean);
  for (const t of tries) if (existsSync(t)) return createRequire(import.meta.url).resolve(t);
  throw new Error('no puppeteer: set PUPPETEER=<path to node_modules/puppeteer>');
};
const puppeteer = (await import(pathToFileURL(findPuppeteer()).href)).default;

// ---- the drawing, by the app's own exporter, from the part as this origin's BIM answers it
const origin = new URL(URL_).origin;
const partRes = await fetch(`${origin}/api/bim/parts/${PART}`);
if (!partRes.ok) throw new Error(`${origin}/api/bim/parts/${PART}: ${partRes.status}`);
writeFileSync(join(OUT, 'part.json'), await partRes.text());
const bundle = (entry, out) => execFileSync(join(ROOT, 'node_modules/.bin/esbuild'),
  [entry, '--bundle', '--platform=node', '--format=esm', `--outfile=${out}`, '--log-level=warning'], { cwd: ROOT });
const cache = join(ROOT, 'node_modules/.cache/kad');
bundle('scripts/wireGesturesFixture.ts', join(cache, 'wireGesturesFixture.mjs'));
execFileSync('node', [join(cache, 'wireGesturesFixture.mjs'), join(OUT, 'part.json'), join(OUT, 'wire-gestures.ifc'), join(OUT, 'plan.json')]);
const plan = JSON.parse(readFileSync(join(OUT, 'plan.json'), 'utf8'));
// the reader: the CAD's own importIfc, for the saved file
writeFileSync(join(cache, 'readIfc.ts'), `import { importIfc } from '../../../src/io/ifc/importIfc';\nimport { readFileSync } from 'node:fs';\nprocess.stdout.write(JSON.stringify(importIfc(readFileSync(process.argv[2], 'utf8')).schematic));\n`);
bundle(join(cache, 'readIfc.ts'), join(cache, 'readIfc.mjs'));
const readIfc = (f) => JSON.parse(execFileSync('node', [join(cache, 'readIfc.mjs'), f], { maxBuffer: 1 << 26 }).toString());

let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  const errors = [];
  page.on('pageerror', (e) => { errors.push(e.message); console.log('pageerror', e.message); });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true });
  // no save dialog in a headless run: Save Model (APKSoftapp.saveModel) falls back to its two downloads
  await page.evaluateOnNewDocument(() => {
    for (const k of ['showSaveFilePicker', 'showDirectoryPicker']) try { delete window[k]; window[k] = undefined; } catch { /* */ }
  });
  await page.goto(URL_, { waitUntil: 'networkidle0' });
  await page.keyboard.press('Escape');   // the welcome card
  const input = await page.waitForSelector('input[type=file][accept=".ifc,.json"]');
  await input.uploadFile(join(OUT, 'wire-gestures.ifc'));
  await page.waitForFunction(() => /Opened wire-gestures/.test(document.body.innerText), { timeout: 30000 });
  await sleep(1500);   // BIM definitions refetched from /api/bim/parts

  const canvas = await page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const readout = () => page.evaluate(() => {
    const s = [...document.querySelectorAll('span')].find((e) => /^x:\s*-?[\d.]+\s+y:\s*-?[\d.]+$/.test(e.textContent.replace(/\u00a0/g, ' ').trim()));
    const m = s && /x:\s*(-?[\d.]+)\s+y:\s*(-?[\d.]+)/.exec(s.textContent.replace(/\u00a0/g, ' '));
    return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
  });

  // ---- the sheet's scale: four screen points against the cursor readout (snap to grid is off in the drawing)
  const samples = [];
  for (const [fx, fy] of [[0.12, 0.12], [0.88, 0.14], [0.14, 0.86], [0.86, 0.88]]) {
    const sx = canvas.x + canvas.w * fx, sy = canvas.y + canvas.h * fy;
    await page.mouse.move(sx, sy);
    await sleep(60);
    const w = await readout();
    if (w) samples.push({ sx, sy, wx: w.x, wy: w.y });
  }
  const fit = (k, s) => {   // least squares w = a*s + b
    const n = samples.length, ms = samples.reduce((t, p) => t + p[s], 0) / n, mw = samples.reduce((t, p) => t + p[k], 0) / n;
    const a = samples.reduce((t, p) => t + (p[s] - ms) * (p[k] - mw), 0) / samples.reduce((t, p) => t + (p[s] - ms) ** 2, 0);
    return { a, b: mw - a * ms };
  };
  const fx = fit('wx', 'sx'), fy = fit('wy', 'sy');
  const resid = Math.max(...samples.map((p) => Math.max(Math.abs(fx.a * p.sx + fx.b - p.wx), Math.abs(fy.a * p.sy + fy.b - p.wy))));
  check(samples.length === 4 && resid < 1, `the cursor readout gives the sheet's scale: ${(1 / Math.abs(fx.a)).toFixed(3)} px/mm, worst residual ${resid.toFixed(2)} mm`);
  const S = (p) => ({ x: (p.x - fx.b) / fx.a, y: (p.y - fy.b) / fy.a });
  const mmPx = Math.abs(fx.a);

  const openWireManager = async () => {
    if (await page.$('[data-wire-manager]')) return;
    await clickText('button', /^Elements:/);
    await clickText('button', /Wire Manager/);
    await page.waitForSelector('[data-wire-manager]', { timeout: 5000 });
  };
  // a real double-click: two press-releases (the second detail 2), and Chrome's dblclick
  const dbl = async (p) => { await page.mouse.click(p.x, p.y, { count: 2 }); };
  const closeModal = async () => { await clickText('button', /^Close/); await sleep(200); };
  const clickText = async (sel, re) => {
    const ok = await page.evaluate((sel, src) => {
      const re = new RegExp(src);
      const b = [...document.querySelectorAll(sel)].find((e) => re.test(e.textContent.trim()) && e.offsetParent !== null);
      if (b) b.click();
      return !!b;
    }, sel, re.source);
    if (!ok) throw new Error(`no ${sel} ${re}`);
    await sleep(250);
  };
  const table = async () => {
    await openWireManager();
    const t = await page.evaluate(() => {
      const box = document.querySelector('[data-wire-manager]');
      const head = box.querySelector('span')?.textContent ?? '';
      const rows = [...box.querySelectorAll('table tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => {
        const sel = td.querySelector('select'); const inp = td.querySelector('input');
        return sel ? sel.options[sel.selectedIndex]?.text ?? '' : inp ? inp.value : td.textContent.trim();
      }));
      return { head, rows };
    });
    await closeModal();
    return t;
  };

  const t0 = await table();
  check(/2 wires/.test(t0.head), `the drawing opened with its wires: ${t0.head}`);
  const w1row = (t) => t.rows.find((r) => /W-001/.test(r[0]));
  const r0 = w1row(t0);
  check(!!r0 && r0[5] !== '' && Number(r0[6]) === 2, `W1 is drawn (its device has a definition): length ${r0?.[5]} mm, ${r0?.[6]} bends`);

  await page.keyboard.press('Escape');   // the Select tool
  // the vertical run of W1 sits halfway along its path; slide it 40 mm right
  const [p0, b0, b1, p3] = plan.wires.W1.path;
  const midRun = { x: b0.x, y: (b0.y + b1.y) / 2 };
  let s = S(midRun);
  await page.mouse.click(s.x, s.y);
  await sleep(150);
  const hint1 = await page.evaluate(() => document.body.innerText);
  if (process.env.DEBUG_SHOTS) { await page.screenshot({ path: join(OUT, 'after-click.png') }); writeFileSync(join(OUT, 'after-click.txt'), hint1); }
  await page.mouse.move(s.x, s.y); await page.mouse.down();
  for (let k = 1; k <= 8; k++) { const q = S({ x: midRun.x + 5 * k, y: midRun.y }); await page.mouse.move(q.x, q.y); await sleep(15); }
  await page.mouse.up();
  await sleep(150);
  // drag the second bend (now at x+40) a further 20 mm right: its neighbour bend follows (the run stays vertical)
  s = S({ x: b1.x + 40, y: b1.y });
  await page.mouse.move(s.x, s.y); await page.mouse.down();
  for (let k = 1; k <= 4; k++) { const q = S({ x: b1.x + 40 + 5 * k, y: b1.y }); await page.mouse.move(q.x, q.y); await sleep(15); }
  await page.mouse.up();
  await sleep(150);
  // double-click the first run (pin → first bend) halfway: a bend there
  const firstRun = { x: Math.round((p0.x + b0.x + 60) / 2 / 10) * 10, y: p0.y };
  if (process.env.DEBUG_SHOTS) {
    await page.screenshot({ path: join(OUT, 'before-dbl.png') });
    await page.evaluate(() => { window.__dbl = []; document.addEventListener('dblclick', (e) => window.__dbl.push([e.target.tagName, e.detail]), true); document.addEventListener('mousedown', (e) => window.__dbl.push(['down', e.detail]), true); });
  }
  s = S(firstRun);
  await dbl(s);
  await sleep(250);
  if (process.env.DEBUG_SHOTS) { await page.screenshot({ path: join(OUT, 'after-dbl.png') }); console.log('dbl events', JSON.stringify(await page.evaluate(() => window.__dbl))); }
  const t1 = await table();
  const r1 = w1row(t1);
  check(Number(r1?.[6]) === 3, `double-click on a run added a bend: ${r1?.[6]} bends`);
  // the selection survives the modal? select W1 again by clicking a run, then double-click the new bend
  await page.keyboard.press('Escape');
  s = S({ x: b0.x + 60, y: midRun.y });
  await page.mouse.click(s.x, s.y);
  await sleep(150);
  s = S(firstRun);
  await dbl(s);
  await sleep(250);
  const t2 = await table();
  const r2 = w1row(t2);
  check(Number(r2?.[6]) === 2, `double-click on that bend took it away: ${r2?.[6]} bends`);

  // W2: click it, Delete
  await page.keyboard.press('Escape');
  const w2 = plan.wires.W2.path;
  const w2mid = { x: (w2[1].x + w2[2].x) / 2, y: (w2[1].y + w2[2].y) / 2 };
  s = S(w2mid);
  await page.mouse.click(s.x, s.y);
  await sleep(150);
  await page.keyboard.press('Delete');
  await sleep(250);
  const t3 = await table();
  check(/1 wire\b/.test(t3.head) && !t3.rows.some((r) => /W-002/.test(r[0])), `Delete on the selected W2 removed it: ${t3.head}`);

  // the Wire Manager: discover the drawn line, accept it
  await openWireManager();
  await clickText('button', /Discover wires/);
  const cands = await page.$eval('[data-wire-candidates]', (e) => Number(e.getAttribute('data-wire-candidates'))).catch(() => -1);
  const candText = await page.$eval('[data-wire-candidates]', (e) => e.innerText).catch(() => '');
  check(cands === 1 && /U3/.test(candText) && /U4/.test(candText), `Discover found the drawn line U3 → U4: ${cands} · ${candText.replace(/\s+/g, ' ').slice(0, 120)}`);
  await clickText('button', /Accept all/);
  await sleep(250);
  const after = await page.evaluate(() => document.querySelector('[data-wire-manager] span')?.textContent ?? '');
  check(/2 wires/.test(after), `Accept made it a wire: ${after}`);

  // the CSVs
  await clickText('button', /Wirelist CSV/);
  await clickText('button', /Netlist CSV/);
  await closeModal();
  // File ▸ Save Model
  await clickText('button', /^File ▾$/);
  await clickText('button', /Save Model/);
  for (let i = 0; i < 40 && !(['wirelist.csv', 'netlist.csv'].every((f) => existsSync(join(DL, f))) && readdirSync(DL).some((f) => f.endsWith('.ifc'))); i++) await sleep(250);
  const files = readdirSync(DL);
  console.log(`     downloads: ${files.join(', ')}`);
  const wl = existsSync(join(DL, 'wirelist.csv')) ? readFileSync(join(DL, 'wirelist.csv'), 'utf8') : '';
  const nl = existsSync(join(DL, 'netlist.csv')) ? readFileSync(join(DL, 'netlist.csv'), 'utf8') : '';
  check(wl.split('\n').filter((l) => l.trim()).length === 3 && /U1/.test(wl) && /U4/.test(wl), `wirelist.csv: header + 2 wires (${wl.split('\n')[0]})`);
  check(nl.split('\n').filter((l) => l.trim()).length >= 3, `netlist.csv: ${nl.split('\n').filter((l) => l.trim()).length - 1} rows`);
  const ifcName = files.find((f) => f.endsWith('.ifc'));
  check(!!ifcName, `Save Model downloaded ${ifcName}`);
  if (ifcName) {
    const saved = readIfc(join(DL, ifcName));
    const w = saved.connectors;
    const one = w.find((c) => c.id === plan.wires.W1.id);
    const want = [{ x: b0.x + 60, y: b0.y }, { x: b1.x + 60, y: b1.y }];
    check(JSON.stringify(one?.route) === JSON.stringify(want), `the saved W1 route is the slid run + dragged bend: ${JSON.stringify(one?.route)} (want ${JSON.stringify(want)})`);
    check(!w.some((c) => c.id === plan.wires.W2.id), 'the saved drawing has no W2');
    const u = (ref) => saved.placements.find((p) => p.id === ref.placementId)?.refdes;
    check(w.some((c) => u(c.from) === 'U3' && u(c.to) === 'U4'), 'the saved drawing has the accepted U3 → U4 wire');
    check(w.every((c) => c.net), `every saved wire is on a net: ${w.map((c) => c.net).join(', ')}`);
    writeFileSync(join(OUT, 'saved.ifc'), readFileSync(join(DL, ifcName)));
  }
  await page.screenshot({ path: join(OUT, 'wire-gestures.png') });
  console.log(`     shot ${join(OUT, 'wire-gestures.png')} · scale ${mmPx.toFixed(4)} mm/px · hint after the first click: ${/wire/i.test(hint1) ? 'mentions a wire' : '—'}`);
  check(!errors.length, `no page errors (${errors.length})`);
} finally {
  await browser.close();
}
console.log(`out ${OUT}`);
process.exit(failed ? 1 : 0);
