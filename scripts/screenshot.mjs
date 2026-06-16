import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:4180/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const fel = [];
page.on('console', (m) => m.type() === 'error' && fel.push(m.text()));
page.on('pageerror', (e) => fel.push(String(e)));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.leaflet-interactive, .klunga', { timeout: 20000 });
await page.waitForTimeout(1500);

await page.screenshot({ path: 'shot-1-oversikt.png' });

// Hitta en klung-bubbla (visar antal) och hovra den.
const klunga = page.locator('.klunga').first();
const antalKlungor = await page.locator('.klunga').count();
console.log('Antal klungor på kartan:', antalKlungor);

if (antalKlungor > 0) {
  const text = await klunga.innerText();
  console.log('Hovrar klunga med text:', text);
  await klunga.hover();
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shot-2-utspridd.png' });
  // Räkna synliga cirkel-markörer före/efter är svårt; logga path-element.
  const paths = await page.locator('.leaflet-overlay-pane path').count();
  console.log('SVG path-element efter hover (cirklar+linjer):', paths);
}

// Byt färgläge till ett nyckeltal och screenshota legenden.
await page.selectOption('.kontroll select', { label: 'Andel behöriga till högskola' });
await page.waitForTimeout(600);
await page.screenshot({ path: 'shot-3-farg.png' });

console.log('Konsolfel:', fel.length ? fel : 'inga');
await browser.close();
