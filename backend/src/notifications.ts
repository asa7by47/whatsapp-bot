import axios from 'axios';

export async function sendTelegramNotification(
  recipientName: string,
  sentAt: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const text = `Message sent to ${recipientName} at ${sentAt}`;

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
  });
}
