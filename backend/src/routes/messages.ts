import { Router } from 'express';
import {
  createMessage,
  deleteMessage,
  getAllMessages,
  type ScheduleType,
  type ScheduledMessage,
  updateMessage,
} from '../db';

const router = Router();
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const phonePattern = /^\+\d+$/;

type MessageResponse = Omit<ScheduledMessage, 'recipients'> & {
  recipients: string[];
};

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseRecipients(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const recipients = [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];

  if (recipients.some((phone) => !phonePattern.test(phone))) {
    return undefined;
  }

  return recipients;
}

function parseStoredRecipients(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function serializeMessage(message: ScheduledMessage): MessageResponse {
  return {
    ...message,
    schedule_type: message.schedule_type ?? 'daily',
    send_date: message.send_date ?? null,
    recipients: parseStoredRecipients(message.recipients),
  };
}

function parseMessageBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body is required.' };
  }

  const content = String((body as { content?: unknown }).content ?? '').trim();
  const sendTime = String((body as { send_time?: unknown }).send_time ?? '').trim();
  const scheduleTypeRaw = (body as { schedule_type?: unknown }).schedule_type;
  const scheduleType = String(scheduleTypeRaw ?? 'daily') as ScheduleType;
  const sendDateRaw = (body as { send_date?: unknown }).send_date;
  const sendDate =
    sendDateRaw === undefined || sendDateRaw === null ? null : String(sendDateRaw).trim();
  const recipients = parseRecipients((body as { recipients?: unknown }).recipients);

  if (!content) {
    return { error: 'content is required.' };
  }

  if (!timePattern.test(sendTime)) {
    return { error: 'send_time must be a valid HH:MM value.' };
  }

  if (scheduleType !== 'daily' && scheduleType !== 'once') {
    return { error: 'schedule_type must be daily or once.' };
  }

  if (recipients === undefined) {
    return { error: 'recipients must be an array of phone strings like +201012345678.' };
  }

  if (scheduleType === 'once') {
    if (!sendDate) {
      return { error: 'send_date is required when schedule_type is once.' };
    }

    if (!datePattern.test(sendDate)) {
      return { error: 'send_date must be a valid YYYY-MM-DD value.' };
    }

    if (sendDate < getTodayDate()) {
      return { error: 'send_date cannot be in the past.' };
    }
  }

  return {
    content,
    send_time: sendTime,
    recipients: JSON.stringify(recipients),
    schedule_type: scheduleType,
    send_date: scheduleType === 'once' ? sendDate : null,
  };
}

function parseEnabled(value: unknown) {
  if (value === undefined) {
    return 1;
  }

  if (value === true || value === 1 || value === '1') {
    return 1;
  }

  if (value === false || value === 0 || value === '0') {
    return 0;
  }

  return undefined;
}

router.get('/', (_req, res) => {
  res.json(getAllMessages().map(serializeMessage));
});

router.post('/', (req, res) => {
  const parsed = parseMessageBody(req.body);

  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const message = createMessage(parsed);
  res.status(201).json(serializeMessage(message));
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid message id.' });
    return;
  }

  const parsed = parseMessageBody(req.body);

  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const isEnabled = parseEnabled(req.body?.is_enabled);

  if (isEnabled === undefined) {
    res.status(400).json({ error: 'is_enabled must be 1, 0, true, or false.' });
    return;
  }

  const message = updateMessage(id, {
    ...parsed,
    is_enabled: isEnabled,
  });

  if (!message) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }

  res.json(serializeMessage(message));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid message id.' });
    return;
  }

  if (!deleteMessage(id)) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }

  res.status(204).send();
});

export default router;
