import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getLatestNotification, type LatestNotification } from '../api/client';
import {
  requestNotificationPermission,
  showBrowserNotification,
} from '../services/notifications';

export function useNotifications() {
  const lastSeenId = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const [toast, setToast] = useState<LatestNotification | null>(null);

  useEffect(() => {
    requestNotificationPermission();

    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const { data } = useQuery({
    queryKey: ['notifications', 'latest'],
    queryFn: getLatestNotification,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!data || data.id === lastSeenId.current) {
      return;
    }

    lastSeenId.current = data.id;
    showBrowserNotification(data.recipient_name, data.sent_at);
    setToast(data);

    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
    }

    hideTimer.current = window.setTimeout(() => {
      setToast(null);
      hideTimer.current = null;
    }, 4_000);
  }, [data]);

  return toast;
}
