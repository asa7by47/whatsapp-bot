import { format } from 'date-fns';
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import {
  createNotificationLog,
  disableMessage,
  getContactByPhone,
  getEnabledMessages,
  markMessageSent,
  type ScheduledMessage,
} from './db';
import { sendTelegramNotification } from './notifications';
import { sendMessageToPhone } from './whatsapp';

let task: ScheduledTask | null = null;

function parseRecipients(value: string | null | undefined) {
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

function getRecipientPhones(message: ScheduledMessage) {
  const recipients = parseRecipients(message.recipients);

  if (recipients.length > 0) {
    return recipients;
  }

  const defaultNumber = process.env.FIANCE_NUMBER;

  if (!defaultNumber) {
    throw new Error('FIANCE_NUMBER is not configured.');
  }

  return [defaultNumber];
}

function getLastSentDate(lastSentAt: string | null) {
  if (!lastSentAt) {
    return null;
  }

  return format(new Date(lastSentAt), 'yyyy-MM-dd');
}

function isMessageDue(message: ScheduledMessage, currentTime: string, currentDate: string) {
  if (message.schedule_type === 'once') {
    return (
      message.send_date === currentDate &&
      message.send_time === currentTime &&
      message.last_sent_at === null
    );
  }

  return (
    message.send_time === currentTime &&
    getLastSentDate(message.last_sent_at) !== currentDate
  );
}

function formatSqlDateUtc(date: Date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function sendNotifications(message: ScheduledMessage, phone: string, now: Date) {
  const contact = getContactByPhone(phone);
  const recipientName = contact?.name ?? phone;
  const sentAtDisplay = format(now, 'HH:mm');
  let notifiedTelegram = 0;

  try {
    await sendTelegramNotification(recipientName, sentAtDisplay);
    notifiedTelegram =
      process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? 1 : 0;
  } catch (error) {
    console.error(`Failed to send Telegram notification for ${phone}:`, error);
  }

  createNotificationLog({
    message_id: message.id,
    recipient_name: recipientName,
    recipient_phone: phone,
    sent_at: formatSqlDateUtc(now),
    notified_telegram: notifiedTelegram,
    notified_browser: 0,
  });
}

export function startScheduler() {
  if (task) {
    return task;
  }

  task = cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const currentDate = format(now, 'yyyy-MM-dd');
    const messages = getEnabledMessages();

    for (const message of messages) {
      if (!isMessageDue(message, currentTime, currentDate)) {
        continue;
      }

      let sentAt: string | null = null;

      try {
        const recipients = getRecipientPhones(message);

        for (const phone of recipients) {
          try {
            await sendMessageToPhone(phone, message.content);
            await sendNotifications(message, phone, now);
            sentAt = now.toISOString();
            console.log(`Sent scheduled message ${message.id} to ${phone} at ${currentTime}.`);
          } catch (error) {
            console.error(`Failed to send scheduled message ${message.id} to ${phone}:`, error);
          }
        }

        if (sentAt) {
          markMessageSent(message.id, sentAt);

          if (message.schedule_type === 'once') {
            disableMessage(message.id);
          }
        }
      } catch (error) {
        console.error(`Failed to process scheduled message ${message.id}:`, error);
      }
    }
  });

  console.log('Message scheduler started.');
  return task;
}

export function stopScheduler() {
  if (!task) {
    return;
  }

  task.stop();
  task = null;
}
