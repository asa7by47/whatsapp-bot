import { useQuery } from '@tanstack/react-query';
import { getStatus } from '../api/client';

export function useWhatsApp() {
  return useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: getStatus,
    refetchInterval: 3000,
  });
}
