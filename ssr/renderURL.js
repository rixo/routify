const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

const browser = await puppeteer.launch({
  // Required
  executablePath: await chromium.executablePath,

  // Optional
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  headless: chromium.headless
});


// In-memory cache of rendered pages. Note: this will be cleared whenever the
// server process stops. If you need true persistence, use something like
// Google Cloud Storage (https://firebase.google.com/docs/storage/web/start).
const RENDER_CACHE = new Map();

async function renderURL(url) {
  if (RENDER_CACHE.has(url)) {
    return { html: RENDER_CACHE.get(url), ttRenderMs: 0 };
  }

  const start = Date.now();

  const page = await browser.newPage();

  try {
    await page.goto(url);
    await page.waitForFunction('window.routify === "ready"')
  } catch (err) {
    console.error(err);
    throw new Error('page.goto/waitForSelector timed out.');
  }

  const html = await page.content(); // serialized HTML of page DOM.
  await page.close();

  const ttRenderMs = Date.now() - start;
  console.info(`Headless rendered page in: ${ttRenderMs}ms`);

  RENDER_CACHE.set(url, html); // cache rendered page.

  return { html, ttRenderMs };
}


module.exports = renderURL