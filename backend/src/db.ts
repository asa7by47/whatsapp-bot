import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export type ScheduleType = 'daily' | 'once';

export type ScheduledMessage = {
  id: number;
  content: string;
  send_time: string;
  is_enabled: number;
  created_at: string;
  last_sent_at: string | null;
  recipients: string;
  schedule_type: ScheduleType;
  send_date: string | null;
};

export type CreateScheduledMessageInput = {
  content: string;
  send_time: string;
  recipients: string;
  schedule_type: ScheduleType;
  send_date: string | null;
};

export type UpdateScheduledMessageInput = CreateScheduledMessageInput & {
  is_enabled: number;
};

export type Contact = {
  id: number;
  name: string;
  phone: string;
  created_at: string;
};

export type CreateContactInput = {
  name: string;
  phone: string;
};

export type NotificationLog = {
  id: number;
  message_id: number;
  recipient_name: string;
  recipient_phone: string;
  sent_at: string;
  notified_telegram: number;
  notified_browser: number;
};

export type CreateNotificationLogInput = {
  message_id: number;
  recipient_name: string;
  recipient_phone: string;
  sent_at: string;
  notified_telegram: number;
  notified_browser: number;
};

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'scheduler.sqlite');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function addColumn(sql: string) {
  try {
    db.exec(sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.toLowerCase().includes('duplicate column name')) {
      throw error;
    }
  }
}

export function initializeDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      send_time TEXT NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_sent_at TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      notified_telegram INTEGER DEFAULT 0,
      notified_browser INTEGER DEFAULT 0
    );
  `);

  addColumn("ALTER TABLE scheduled_messages ADD COLUMN recipients TEXT DEFAULT '[]'");
  addColumn("ALTER TABLE scheduled_messages ADD COLUMN schedule_type TEXT DEFAULT 'daily'");
  addColumn('ALTER TABLE scheduled_messages ADD COLUMN send_date TEXT DEFAULT NULL');
}

export function getAllMessages(): ScheduledMessage[] {
  return db
    .prepare('SELECT * FROM scheduled_messages ORDER BY send_time ASC, id ASC')
    .all() as ScheduledMessage[];
}

export function getEnabledMessages(): ScheduledMessage[] {
  return db
    .prepare('SELECT * FROM scheduled_messages WHERE is_enabled = 1 ORDER BY id ASC')
    .all() as ScheduledMessage[];
}

export function createMessage(input: CreateScheduledMessageInput): ScheduledMessage {
  const result = db
    .prepare(
      `INSERT INTO scheduled_messages
        (content, send_time, recipients, schedule_type, send_date)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.content, input.send_time, input.recipients, input.schedule_type, input.send_date);

  return getMessageById(Number(result.lastInsertRowid)) as ScheduledMessage;
}

export function getMessageById(id: number): ScheduledMessage | undefined {
  return db
    .prepare('SELECT * FROM scheduled_messages WHERE id = ?')
    .get(id) as ScheduledMessage | undefined;
}

export function updateMessage(
  id: number,
  input: UpdateScheduledMessageInput,
): ScheduledMessage | undefined {
  const result = db
    .prepare(
      `UPDATE scheduled_messages
       SET content = ?, send_time = ?, is_enabled = ?, recipients = ?, schedule_type = ?, send_date = ?
       WHERE id = ?`,
    )
    .run(
      input.content,
      input.send_time,
      input.is_enabled,
      input.recipients,
      input.schedule_type,
      input.send_date,
      id,
    );

  if (result.changes === 0) {
    return undefined;
  }

  return getMessageById(id);
}

export function deleteMessage(id: number): boolean {
  const result = db.prepare('DELETE FROM scheduled_messages WHERE id = ?').run(id);
  return result.changes > 0;
}

export function markMessageSent(id: number, sentAt: string) {
  db.prepare('UPDATE scheduled_messages SET last_sent_at = ? WHERE id = ?').run(sentAt, id);
}

export function disableMessage(id: number) {
  db.prepare('UPDATE scheduled_messages SET is_enabled = 0 WHERE id = ?').run(id);
}

export function getAllContacts(): Contact[] {
  return db.prepare('SELECT * FROM contacts ORDER BY name COLLATE NOCASE ASC').all() as Contact[];
}

export function createContact(input: CreateContactInput): Contact {
  const result = db
    .prepare('INSERT INTO contacts (name, phone) VALUES (?, ?)')
    .run(input.name, input.phone);

  return getContactById(Number(result.lastInsertRowid)) as Contact;
}

export function getContactById(id: number): Contact | undefined {
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact | undefined;
}

export function getContactByPhone(phone: string): Contact | undefined {
  return db.prepare('SELECT * FROM contacts WHERE phone = ?').get(phone) as Contact | undefined;
}

export function deleteContact(id: number): boolean {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return result.changes > 0;
}

export function createNotificationLog(input: CreateNotificationLogInput): NotificationLog {
  const result = db
    .prepare(
      `INSERT INTO notification_log
        (message_id, recipient_name, recipient_phone, sent_at, notified_telegram, notified_browser)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.message_id,
      input.recipient_name,
      input.recipient_phone,
      input.sent_at,
      input.notified_telegram,
      input.notified_browser,
    );

  return getNotificationLogById(Number(result.lastInsertRowid)) as NotificationLog;
}

export function getNotificationLogById(id: number): NotificationLog | undefined {
  return db
    .prepare('SELECT * FROM notification_log WHERE id = ?')
    .get(id) as NotificationLog | undefined;
}

export function getLatestNotificationWithinTwoMinutes(): NotificationLog | null {
  const row = db
    .prepare(
      `SELECT * FROM notification_log
       WHERE sent_at >= datetime('now', '-2 minutes')
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get() as NotificationLog | undefined;

  return row ?? null;
}
