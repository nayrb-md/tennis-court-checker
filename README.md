# Tennis court checker

Signs in to [apps.miraflores.gob.pe](https://apps.miraflores.gob.pe) with your credentials, checks the reservation calendar, and sends a Telegram message when new dates open. It never books or pays. You still complete checkout yourself.

The city site uses Incapsula bot protection, so unattended runs (GitHub Actions, a background Mac job) don't see the calendar. Run this yourself a few times a day.

## Create a Telegram bot

1. In Telegram, message **@BotFather**, send `/newbot`, and follow the prompts. Copy the **bot token**.
2. Start a chat with your bot and send any message.
3. Open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser, or message **@userinfobot**. Copy the numeric **chat ID**.

## Run a check

1. Create a `.env` file in the project folder. Don't commit it.

   ```
   MIRAFLORES_USERNAME=your_username
   MIRAFLORES_PASSWORD=your_password
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_CHAT_ID=123456789
   ```

2. Install dependencies once:

   ```bash
   npm install
   ```

3. Run the checker:

   ```bash
   npm run check
   ```

A Chrome window opens, signs in, and reads Paso 1 (**Elige Fecha y Hora**). The console lists **Currently available dates**. Telegram only pings when a date is new since the last successful run.

## Review the selectors

`config.js` already has the selectors for the live booking site.

- **Sign-in.** The app redirects to Keycloak SSO at `sso.miraflores.gob.pe`. The username and password fields use `#username` and `#password`. The **Sign In** control is `button[name="login"]`.
- **Calendar.** Paso 1 uses a flatpickr popup. Open it by selecting **Elige una fecha**, then read `.flatpickr-day` cells.
- **Day status.** `disponible` is bookable (green), `ocupada` is full (red), and `no-disponible` is grey (in the past or not released yet).

If the site layout changes, recapture the page:

```bash
npm run inspect
```

## How dates are released

The calendar keeps about an eight-day window open (today through today + 7). Later days stay `no-disponible` until they're released. The window rolls forward about one day at a time.
