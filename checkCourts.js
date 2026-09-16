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

async function signIn(page, username, password) {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () =>
      location.href.includes('sso.miraflores.gob.pe') ||
      (document.body && document.body.innerText.includes('Cerrar Sesión')),
    { timeout: 30000 }
  );
  if (!page.url().includes('sso.miraflores.gob.pe')) {
    return;
  }

  await page.waitForSelector(SELECTORS.usernameInput, { timeout: 20000 });
  await page.type(SELECTORS.usernameInput, username);
  await page.type(SELECTORS.passwordInput, password);
  await page.click(SELECTORS.loginButton);
  await page.waitForFunction(
    () => document.body && document.body.innerText.includes('Cerrar Sesión'),
    { timeout: 30000 }
  );
}

async function openCalendar(page) {
  await page.goto(BOOKING_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector(SELECTORS.dateFieldToOpenCalendar, {
    visible: true,
    timeout: 30000,
  });
  await page.click(SELECTORS.dateFieldToOpenCalendar);
  await page.waitForSelector(SELECTORS.dayCell, { timeout: 20000 });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    const username = process.env.MIRAFLORES_USERNAME;
    const password = process.env.MIRAFLORES_PASSWORD;
    if (!username || !password) {
      throw new Error('Missing MIRAFLORES_USERNAME or MIRAFLORES_PASSWORD env vars.');
    }

    await signIn(page, username, password);
    console.log('Logged in at', page.url());

    await openCalendar(page);
    console.log('Calendar loaded at', page.url());

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
    console.error('Error checking courts:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
