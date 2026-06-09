import { useQuery } from '@tanstack/react-query';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { getMessages } from '../api/client';
import { QRCard } from '../components/QRCard';
import { StatusBadge } from '../components/StatusBadge';
import { useWhatsApp } from '../hooks/useWhatsApp';

export function Dashboard() {
  const { data: status, isLoading: isStatusLoading } = useWhatsApp();
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: getMessages,
  });

  const enabledCount = messages.filter((message) => message.is_enabled === 1).length;
  const currentStatus = status?.status ?? 'disconnected';

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-rose-600">Romantic WhatsApp Scheduler</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Today&apos;s connection</h1>
          </div>
          {isStatusLoading ? (
            <span className="text-sm text-slate-500">Checking WhatsApp...</span>
          ) : (
            <StatusBadge status={currentStatus} />
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-rose-50 text-rose-600">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-500">Messages</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">
            {isMessagesLoading ? '-' : messages.length}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <Send className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-500">Enabled</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">
            {isMessagesLoading ? '-' : enabledCount}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
            <Heart className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-500">Recipient</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">Fiancee</p>
        </div>
      </section>

      {currentStatus === 'scanning' ? <QRCard qr={status?.qr} /> : null}
    </div>
  );
}
