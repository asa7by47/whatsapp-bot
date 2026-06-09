import axios from 'axios';

export type WhatsAppStatus = 'connected' | 'disconnected' | 'scanning';
export type ScheduleType = 'daily' | 'once';

export type StatusResponse = {
  status: WhatsAppStatus;
  qr?: string;
};

export type Contact = {
  id: number;
  name: string;
  phone: string;
  created_at: string;
};

export type WhatsAppContact = {
  name: string;
  phone: string;
};

export type ScheduledMessage = {
  id: number;
  content: string;
  send_time: string;
  is_enabled: number;
  created_at: string;
  last_sent_at: string | null;
  recipients: string[];
  schedule_type: ScheduleType;
  send_date: string | null;
};

export type MessagePayload = {
  content: string;
  send_time: string;
  recipients: string[];
  schedule_type: ScheduleType;
  send_date: string | null;
};

export type UpdateMessagePayload = MessagePayload & {
  is_enabled: number;
};

export type LatestNotification = {
  id: number;
  recipient_name: string;
  sent_at: string;
};

const api = axios.create({
  baseURL: '/api',
});

export async function getStatus() {
  const { data } = await api.get<StatusResponse>('/status');
  return data;
}

export async function getMessages() {
  const { data } = await api.get<ScheduledMessage[]>('/messages');
  return data;
}

export async function createMessage(payload: MessagePayload) {
  const { data } = await api.post<ScheduledMessage>('/messages', payload);
  return data;
}

export async function updateMessage(id: number, payload: UpdateMessagePayload) {
  const { data } = await api.put<ScheduledMessage>(`/messages/${id}`, payload);
  return data;
}

export async function deleteMessage(id: number) {
  await api.delete(`/messages/${id}`);
}

export async function getContacts() {
  const { data } = await api.get<Contact[]>('/contacts');
  return data;
}

export async function createContact(payload: Pick<Contact, 'name' | 'phone'>) {
  const { data } = await api.post<Contact>('/contacts', payload);
  return data;
}

export async function deleteContact(id: number) {
  await api.delete(`/contacts/${id}`);
}

export async function getWhatsAppContacts() {
  const { data } = await api.get<WhatsAppContact[]>('/contacts/whatsapp');
  return data;
}

export async function getLatestNotification() {
  const { data } = await api.get<LatestNotification | null>('/notifications/latest');
  return data;
}
