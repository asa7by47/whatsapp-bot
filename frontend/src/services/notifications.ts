export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(recipientName: string, sentAt: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification('WhatsApp Bot', {
    body: `Message sent to ${recipientName} at ${sentAt}`,
    icon: '/favicon.ico',
  });
}
