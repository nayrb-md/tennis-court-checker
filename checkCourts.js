require('dotenv').config();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { LOGIN_URL, BOOKING_URL, SELECTORS } = require('./config');

const STATE_FILE = path.join(__dirname, 'state.json');

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { knownAvailable: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function sendTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID — skipping notification.');
    console.log('Message would have been:', message);
    return;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });
  if (!res.ok) {
    console.error('Telegram send failed:', await res.text());
    return;
  }
  console.log('Telegram notification sent.');
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    const username = process.env.MIRAFLORES_USERNAME;
    const password = process.env.MIRAFLORES_PASSWORD;
    if (!username || !password) {
      throw new Error('Missing MIRAFLORES_USERNAME or MIRAFLORES_PASSWORD env vars.');
    }

    // 1. Go to the app. If not logged in, it redirects to Keycloak SSO.
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    const onKeycloak = page.url().includes('sso.miraflores.gob.pe');
    if (onKeycloak) {
      await page.waitForSelector(SELECTORS.usernameInput, { timeout: 15000 });
      await page.type(SELECTORS.usernameInput, username);
      await page.type(SELECTORS.passwordInput, password);
      await Promise.all([
        page.click(SELECTORS.loginButton),
        page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
      ]);
      await page.waitForFunction(
        () => document.body && document.body.innerText.includes('Cerrar Sesión'),
        { timeout: 20000 }
      );
    }
    console.log('Logged in at', page.url());

    // 2. Go to the booking calendar page. Angular mounts the calendar after
    // networkidle, so give it a beat before waiting on day cells.
    await page.goto(BOOKING_URL, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2500));
    await page.waitForFunction(
      (dayCell) => document.querySelectorAll(dayCell).length > 0,
      { timeout: 20000 },
      SELECTORS.dayCell
    );
    console.log('Calendar loaded at', page.url());

    // 4. Read every day cell's status from its class list + aria-label.
    const days = await page.$$eval(
      SELECTORS.dayCell,
      (cells, { availableClass, fullClass, disabledClass }) =>
        cells.map((c) => ({
          label: c.getAttribute('aria-label') || c.textContent.trim(),
          available: c.classList.contains(availableClass),
          full: c.classList.contains(fullClass),
          disabled: c.classList.contains(disabledClass),
        })),
      SELECTORS
    );

    const availableDates = days.filter((d) => d.available).map((d) => d.label);

    // 5. Compare against last run.
    const state = loadState();
    const newDates = availableDates.filter((d) => !state.knownAvailable.includes(d));

    console.log('Currently available dates:', availableDates);
    console.log('New since last check:', newDates);

    if (newDates.length > 0) {
      await sendTelegram(
        `🎾 New tennis court slots just opened at Centro Promotor de Tenis: ${newDates.join(
          ', '
        )}.\nBook here: ${BOOKING_URL}`
      );
    }

    state.knownAvailable = availableDates;
    saveState(state);
  } catch (err) {
    console.error('Error checking courts:', err);
    await sendTelegram(`⚠️ Court-checker script hit an error: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
