# Tennis Court Checker

Signs in to [apps.miraflores.gob.pe](https://apps.miraflores.gob.pe) with your credentials, checks the reservation calendar, and sends a Telegram message when new dates open. It never books or pays. You still complete checkout yourself.

## Create a Telegram bot

1. In Telegram, message **@BotFather**, send `/newbot`, and follow the prompts. Copy the **bot token**.
2. Start a chat with your bot and send any message.
3. Open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser, or message **@userinfobot**. Copy the numeric **chat ID**.

## Create the GitHub repository

1. Create a **public** GitHub repository. Public repositories get unlimited free GitHub Actions minutes.
2. Push this project to the repository.
3. Go to **Settings** > **Secrets and variables** > **Actions**.
4. Add these secrets:

   - `MIRAFLORES_USERNAME`
   - `MIRAFLORES_PASSWORD`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

## Review the selectors

`config.js` already has the selectors for the live booking site.

- **Sign-in.** The app redirects to Keycloak SSO at `sso.miraflores.gob.pe`. The username and password fields use `#username` and `#password`. The **Sign In** control is `button[name="login"]`, not Keycloak's default `#kc-login`.
- **Calendar.** Paso 1 (**Elige Fecha y Hora**) shows an inline flatpickr calendar. Day cells use `.flatpickr-day`.
- **Day status.** `disponible` is bookable (green), `ocupada` is full (red), and `no-disponible` is grey (in the past or not released yet).

If the site layout changes and the script can't find those elements, capture the live page:

```bash
npm install
npm run inspect
```

A visible browser window opens. Sign in, go to the calendar, return to the terminal, and press Enter. The script writes `calendar-dump.html`. Use that file, or paste it into a coding agent, to update `config.js`.

## Test locally before you rely on the schedule

1. Create a `.env` file in the project folder. Don't commit it.

   ```
   MIRAFLORES_USERNAME=your_username
   MIRAFLORES_PASSWORD=your_password
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_CHAT_ID=123456789
   ```

2. Run the checker:

   ```bash
   npm run check
   ```

3. Confirm the console lists **Currently available dates**. When that looks right, use GitHub Actions for the schedule.

## Run the checker on a schedule

Push to GitHub. The workflow in `.github/workflows/check-courts.yml` runs every 30 minutes from 6:00 a.m. to 9:00 p.m. Peru time (UTC-5). To test a single run, go to the **Actions** tab and select **Run workflow**.

## How dates are released

The calendar keeps about an eight-day window open (today through today + 7). Later days stay `no-disponible` until they're released. The window rolls forward about one day at a time; a full week doesn't drop at once.

After the checker has run for a few days, use the history of `state.json` or the Actions logs to see when the newest day changes from grey to available. That's the rollover time to plan around.
