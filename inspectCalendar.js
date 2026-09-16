// Run this LOCALLY (on your own computer, not on GitHub Actions):
//   npm install
//   npm run inspect
//
// It opens a REAL, visible browser window. Log in and click through to the
// "Paso 2: Elige tu Cancha" calendar yourself, then come back to the
// terminal and press Enter. It will save the page's HTML to
// calendar-dump.html so you (or Claude, if you paste the relevant snippet
// back in a chat) can find the exact selectors for config.js.

const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://apps.miraflores.gob.pe/');

  console.log('\n1. Log in manually in the browser window that just opened.');
  console.log('2. Navigate to "Paso 2: Elige tu Cancha" for the hard/cement courts.');
  console.log('3. Come back here and press Enter.\n');

  await new Promise((resolve) => {
    process.stdin.once('data', resolve);
  });

  const html = await page.content();
  fs.writeFileSync('calendar-dump.html', html);
  console.log('Saved calendar-dump.html in this folder.');
  console.log('Open it in a text editor and search for the calendar grid to find:');
  console.log('  - the repeated element/class for each day cell');
  console.log('  - the class that only appears on FULL (red) days');
  console.log('  - the login form field names/ids from the login page (view separately if needed)\n');

  await browser.close();
  process.exit(0);
})();
