import { Router } from 'express';
import { createContact, deleteContact, getAllContacts } from '../db';
import { getConnectedWhatsAppClient } from '../whatsapp';

const router = Router();
const phonePattern = /^\+\d+$/;

function parseContactBody(body: unknown) {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body is required.' };
  }

  const name = String((body as { name?: unknown }).name ?? '').trim();
  const phone = String((body as { phone?: unknown }).phone ?? '').trim();

  if (!name) {
    return { error: 'name is required.' };
  }

  if (!phonePattern.test(phone)) {
    return { error: 'phone must start with + and contain only digits after it.' };
  }

  return { name, phone };
}

router.get('/', (_req, res) => {
  res.json(getAllContacts());
});

router.post('/', (req, res) => {
  const parsed = parseContactBody(req.body);

  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const contact = createContact(parsed);
    res.status(201).json(contact);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes('unique constraint failed')) {
      res.status(409).json({ error: 'A contact with this phone already exists.' });
      return;
    }

    throw error;
  }
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid contact id.' });
    return;
  }

  if (!deleteContact(id)) {
    res.status(404).json({ error: 'Contact not found.' });
    return;
  }

  res.status(204).send();
});

router.get('/whatsapp', async (_req, res) => {
  try {
    const client = getConnectedWhatsAppClient();
    const chats = await client.getChats();
    const contacts = chats
      .filter((chat) => !chat.isGroup && chat.id.server === 'c.us' && Boolean(chat.id.user))
      .slice(0, 30)
      .map((chat) => ({
        name: chat.name || chat.id.user,
        phone: `+${chat.id.user}`,
      }));

    res.json(contacts);
  } catch (error) {
    res.status(503).json({
      error: error instanceof Error ? error.message : 'Unable to fetch WhatsApp chats.',
    });
  }
});

export default router;
