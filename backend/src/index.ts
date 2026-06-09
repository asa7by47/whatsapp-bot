import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { initializeDb } from './db';
import contactsRouter from './routes/contacts';
import messagesRouter from './routes/messages';
import notificationsRouter from './routes/notifications';
import statusRouter from './routes/status';
import { startScheduler, stopScheduler } from './scheduler';
import { destroyWhatsApp, initializeWhatsApp } from './whatsapp';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

initializeDb();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/status', statusRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/notifications', notificationsRouter);

const publicPath = path.join(__dirname, '..', 'public');

if (process.env.NODE_ENV === 'production' && fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }

    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});

initializeWhatsApp();
startScheduler();

async function shutdown() {
  stopScheduler();
  await destroyWhatsApp();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
