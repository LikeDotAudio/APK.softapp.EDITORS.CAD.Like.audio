// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A FOREIGN .ifc through File ▸ Open Model, in headless Chrome, photographed
 * (ROAD-3598, answer 1). It serves a built dist/, opens the editor, hands the
 * file to the Open Model input, and fails unless:
 *   - the page fetched the shared loader and web-ifc's wasm (a foreign file), and
 *     the hint says the products came in through web-ifc as plan edges;
 *   - opening one of OUR files first fetched neither (the codec read it).
 *
 *   node scripts/webifc-headless.mjs [dist] [foreign.ifc] [out.png]
 *
 * Needs puppeteer (the monorepo root has it; or PUPPETEER=<path>) and Chrome
 * (CHROME=<path>, else /usr/bin/google-chrome).
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(process.argv[2] ?? join(ROOT, 'dist'));
const FOREIGN = resolve(process.argv[3] ?? join(ROOT, 'src/io/ifc/fixtures/foreign-room.ifc'));
const OURS = join(ROOT, 'src/io/ifc/fixtures/keithley--2400.ifc');
const OUT = resolve(process.argv[4] ?? join(ROOT, 'webifc-foreign.png'));

const findPuppeteer = () => {
  const tries = [process.env.PUPPETEER, join(ROOT, 'node_modules/puppeteer'), join(ROOT, '../../../../../node_modules/puppeteer')].filter(Boolean);
  for (const t of tries) if (existsSync(t)) return createRequire(import.meta.url).resolve(t);
  throw new Error('no puppeteer: set PUPPETEER=<path to node_modules/puppeteer>');
};
const puppeteer = (await import(pathToFileURL(findPuppeteer()).href)).default;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.md': 'text/markdown' };
const fetched = [];
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = join(DIST, p === '/' ? 'index.html' : p);
  if (!f.startsWith(DIST) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
  fetched.push(p);
  res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.keyboard.press('Escape'); // the welcome card: skip to the canvas
  const input = await page.waitForSelector('input[type=file][accept=".ifc,.json"]');
  const hint = async (re) => page.waitForFunction((src) => new RegExp(src).test(document.body.innerText), { timeout: 60000 }, re.source)
    .then(() => true, () => false);

  await input.uploadFile(OURS);
  check(await hint(/Opened keithley--2400\.ifc/), 'our own file opened (codec)');
  check(!fetched.some((p) => /apk-webifc|web-ifc/.test(p)), 'opening our own file fetched no engine');

  await input.uploadFile(FOREIGN);
  const ok = await hint(/web-ifc\) — \d+ products as \d+ plan edges/);
  check(ok, 'the foreign file opened through web-ifc');
  check(fetched.includes('/vendor/apk-webifc/apk-webifc.js'), 'the shared loader was fetched');
  check(fetched.includes('/vendor/apk-webifc/web-ifc/web-ifc.wasm'), 'web-ifc.wasm was fetched, as published');
  const line = await page.evaluate(() => (document.body.innerText.match(/Opened [^\n]*web-ifc[^\n]*/) ?? [''])[0]);
  console.log(`     ${line}`);
  // Zoom All, then the photograph
  await page.evaluate(() => { const b = document.querySelector('[title^="Zoom All"]'); if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: OUT });
  console.log(`shot ${OUT}`);
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
