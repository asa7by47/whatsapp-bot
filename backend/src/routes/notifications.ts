import { format } from 'date-fns';
import { Router } from 'express';
import { getLatestNotificationWithinTwoMinutes } from '../db';

const router = Router();

router.get('/latest', (_req, res) => {
  const row = getLatestNotificationWithinTwoMinutes();

  if (!row) {
    res.json(null);
    return;
  }

  res.json({
    id: row.id,
    recipient_name: row.recipient_name,
    sent_at: format(new Date(`${row.sent_at.replace(' ', 'T')}Z`), 'HH:mm'),
  });
});

export default router;
