import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';

export type WhatsAppStatus = 'connected' | 'disconnected' | 'scanning';

let client: Client | null = null;
let status: WhatsAppStatus = 'disconnected';
let qrImage: string | undefined;

export function formatPhoneNumberForWhatsApp(phoneNumber: string) {
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  if (!digitsOnly) {
    throw new Error('Phone number must contain a WhatsApp phone number with country code.');
  }

  return `${digitsOnly}@c.us`;
}

export async function initializeWhatsApp() {
  if (client) {
    return client;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'romantic-message-scheduler',
      dataPath: '.wwebjs_auth',
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', async (qr) => {
    status = 'scanning';
    qrImage = await QRCode.toDataURL(qr);
    const terminalQr = await QRCode.toString(qr, { type: 'terminal', small: true });
    console.log('Scan this QR code with WhatsApp:');
    console.log(terminalQr);
  });

  client.on('authenticated', () => {
    status = 'scanning';
    qrImage = undefined;
    console.log('WhatsApp authentication completed.');
  });

  client.on('ready', () => {
    status = 'connected';
    qrImage = undefined;
    console.log('WhatsApp client is ready.');
  });

  client.on('auth_failure', (message) => {
    status = 'disconnected';
    qrImage = undefined;
    console.error('WhatsApp authentication failed:', message);
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    qrImage = undefined;
    console.warn('WhatsApp client disconnected:', reason);
  });

  client.initialize().catch((error) => {
    status = 'disconnected';
    qrImage = undefined;
    console.error('Failed to initialize WhatsApp client:', error);
  });

  return client;
}

export function getWhatsAppStatus() {
  return {
    status,
    ...(qrImage ? { qr: qrImage } : {}),
  };
}

export function getConnectedWhatsAppClient() {
  if (!client || status !== 'connected') {
    throw new Error('WhatsApp is not connected.');
  }

  return client;
}

export async function sendMessageToPhone(phoneNumber: string, content: string) {
  const connectedClient = getConnectedWhatsAppClient();
  const chatId = formatPhoneNumberForWhatsApp(phoneNumber);
  await connectedClient.sendMessage(chatId, content);
}

export async function sendMessageToFiance(content: string) {
  const fianceNumber = process.env.FIANCE_NUMBER;

  if (!fianceNumber) {
    throw new Error('FIANCE_NUMBER is not configured.');
  }

  await sendMessageToPhone(fianceNumber, content);
}

export async function destroyWhatsApp() {
  if (!client) {
    return;
  }

  await client.destroy();
  client = null;
  status = 'disconnected';
  qrImage = undefined;
}
