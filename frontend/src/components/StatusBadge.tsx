import { CheckCircle2, QrCode, WifiOff } from 'lucide-react';
import type { WhatsAppStatus } from '../api/client';

type StatusBadgeProps = {
  status: WhatsAppStatus;
};

const config = {
  connected: {
    label: 'Connected',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Icon: CheckCircle2,
  },
  scanning: {
    label: 'Scan QR',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    Icon: QrCode,
  },
  disconnected: {
    label: 'Disconnected',
    className: 'border-red-200 bg-red-50 text-red-700',
    Icon: WifiOff,
  },
} satisfies Record<WhatsAppStatus, { label: string; className: string; Icon: typeof CheckCircle2 }>;

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, Icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}
