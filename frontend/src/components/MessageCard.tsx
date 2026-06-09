import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Edit3, Power, Trash2 } from 'lucide-react';
import { getContacts, type ScheduledMessage } from '../api/client';

type MessageCardProps = {
  message: ScheduledMessage;
  onToggle: (message: ScheduledMessage) => void;
  onEdit: (message: ScheduledMessage) => void;
  onDelete: (message: ScheduledMessage) => void;
};

function formatSendTime(sendTime: string) {
  const [hours, minutes] = sendTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

function formatSendDate(sendDate: string) {
  return format(new Date(`${sendDate}T00:00:00`), 'PPP');
}

export function MessageCard({ message, onToggle, onEdit, onDelete }: MessageCardProps) {
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });

  const isEnabled = message.is_enabled === 1;
  const isOneTime = message.schedule_type === 'once';
  const isOneTimeSent = isOneTime && Boolean(message.last_sent_at);

  function getRecipientLabel(phone: string) {
    return contacts.find((contact) => contact.phone === phone)?.name ?? phone;
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-700">
              {formatSendTime(message.send_time)}
            </span>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                isOneTime
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-teal-50 text-teal-700'
              }`}
            >
              {isOneTime ? 'One-time' : 'Daily'}
            </span>
            {isOneTimeSent ? (
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Sent
              </span>
            ) : (
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>

          {isOneTime && message.send_date ? (
            <p className="mb-3 text-xs font-medium text-slate-500">
              {formatSendDate(message.send_date)}
            </p>
          ) : null}

          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
            {message.content}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {message.recipients.length > 0 ? (
              message.recipients.map((phone) => (
                <span
                  key={phone}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                >
                  {getRecipientLabel(phone)}
                </span>
              ))
            ) : (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                Default contact
              </span>
            )}
          </div>

          {message.last_sent_at ? (
            <p className="mt-3 text-xs text-slate-500">
              Last sent {format(new Date(message.last_sent_at), 'PPp')}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isOneTimeSent ? null : (
            <button
              type="button"
              onClick={() => onToggle(message)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                isEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
              title={isEnabled ? 'Disable message' : 'Enable message'}
              aria-label={isEnabled ? 'Disable message' : 'Enable message'}
            >
              <Power className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(message)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            title="Edit message"
            aria-label="Edit message"
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(message)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
            title="Delete message"
            aria-label="Delete message"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
