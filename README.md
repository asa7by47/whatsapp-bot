# WhatsApp Romantic Message Scheduler Bot

A single-service Node.js + React app for scheduling WhatsApp messages at specific times of day. The backend manages WhatsApp Web authentication, SQLite storage, and cron delivery. The frontend provides a browser dashboard for QR login and message management.

## Stack

- Backend: Node.js, Express, TypeScript, whatsapp-web.js, node-cron, better-sqlite3, qrcode, dotenv
- Frontend: Vite, React 18, TypeScript, TailwindCSS, TanStack Query v5, React Hook Form, Zod, date-fns, Axios
- Database: SQLite at `backend/data/scheduler.sqlite`
- Deployment: Railway single service

## Local Setup

Create `backend/.env`:

```env
PORT=3000
FIANCE_NUMBER=+201XXXXXXXXX
NODE_ENV=development
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Install dependencies, build the frontend, and start the backend:

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix frontend run build
npm --prefix backend run dev
```

For frontend development, run Vite in another terminal:

```bash
npm --prefix frontend run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`.

## WhatsApp Login

1. Start the backend.
2. Open the frontend in a browser.
3. If WhatsApp is not authenticated, the dashboard shows a QR code.
4. Scan the QR code with WhatsApp on your phone.
5. The session is persisted in `backend/.wwebjs_auth`.

## API

- `GET /api/status` returns `{ status: 'connected' | 'disconnected' | 'scanning', qr?: string }`
- `GET /api/contacts` returns saved recipients
- `POST /api/contacts` creates a contact with `{ name, phone }`
- `DELETE /api/contacts/:id` deletes a contact
- `GET /api/contacts/whatsapp` returns up to 30 recent non-group WhatsApp chats
- `GET /api/messages` returns all scheduled messages with recipients and schedule type
- `POST /api/messages` creates a message with `{ content, send_time, recipients, schedule_type, send_date }`
- `PUT /api/messages/:id` updates `{ content, send_time, recipients, schedule_type, send_date, is_enabled }`
- `DELETE /api/messages/:id` deletes a message
- `GET /api/notifications/latest` returns the latest browser notification event or `null`

## Railway Deployment

Set these Railway environment variables:

```env
PORT=3000
FIANCE_NUMBER=+201XXXXXXXXX
NODE_ENV=production
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Railway uses `railway.json` to:

1. Install and build the frontend.
2. Copy `frontend/dist` into `backend/public`.
3. Install and build the backend.
4. Start the backend from `backend/dist/index.js`.

In production, Express serves the built frontend and the API from the same service.

## Scheduling Behavior

The scheduler runs every minute and checks enabled messages whose `send_time` matches the current server time in `HH:MM` format. Daily messages are sent once per calendar day. One-time messages require `send_date`, are sent only on that date, and are disabled after a successful send.

Messages can target multiple recipients from the contacts table. If a message has no recipients, it falls back to `FIANCE_NUMBER`.

Telegram notifications are optional. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `backend/.env` or your deployment environment to receive Telegram alerts after WhatsApp sends succeed.

If you deploy to a host running UTC and want local Cairo time, set `TZ=Africa/Cairo` in the service environment.

## Required Commands

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix frontend run build
npm --prefix backend run dev
```
