import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  getContacts,
  type Contact,
  type MessagePayload,
  type ScheduledMessage,
} from '../api/client';

const phonePattern = /^\+\d+$/;

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const messageSchema = z
  .object({
    content: z.string().trim().min(1, 'Write a message first.'),
    send_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time.'),
    schedule_type: z.enum(['daily', 'once']),
    send_date: z.string(),
    recipients: z.array(z.string().regex(phonePattern, 'Phone must start with + and use digits only.')),
  })
  .superRefine((value, ctx) => {
    if (value.schedule_type !== 'once') {
      return;
    }

    if (!value.send_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['send_date'],
        message: 'Choose a send date.',
      });
      return;
    }

    if (value.send_date < getTodayDate()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['send_date'],
        message: 'Send date cannot be in the past.',
      });
    }
  });

type MessageFormValues = z.infer<typeof messageSchema>;

type MessageFormProps = {
  initialMessage?: ScheduledMessage | null;
  isSubmitting?: boolean;
  onSubmit: (payload: MessagePayload) => void;
  onCancel: () => void;
};

function getContactLabel(contacts: Contact[], phone: string) {
  return contacts.find((contact) => contact.phone === phone)?.name ?? phone;
}

export function MessageForm({
  initialMessage,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: MessageFormProps) {
  const [contactSearch, setContactSearch] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [rawPhoneError, setRawPhoneError] = useState<string | null>(null);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: initialMessage?.content ?? '',
      send_time: initialMessage?.send_time ?? '09:00',
      schedule_type: initialMessage?.schedule_type ?? 'daily',
      send_date: initialMessage?.send_date ?? '',
      recipients: initialMessage?.recipients ?? [],
    },
  });

  const selectedRecipients = watch('recipients') ?? [];
  const scheduleType = watch('schedule_type');

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) || contact.phone.includes(query),
    );
  }, [contactSearch, contacts]);

  useEffect(() => {
    reset({
      content: initialMessage?.content ?? '',
      send_time: initialMessage?.send_time ?? '09:00',
      schedule_type: initialMessage?.schedule_type ?? 'daily',
      send_date: initialMessage?.send_date ?? '',
      recipients: initialMessage?.recipients ?? [],
    });
    setRawPhone('');
    setRawPhoneError(null);
  }, [initialMessage, reset]);

  function updateRecipients(recipients: string[]) {
    setValue('recipients', recipients, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function toggleContact(phone: string) {
    if (selectedRecipients.includes(phone)) {
      updateRecipients(selectedRecipients.filter((recipient) => recipient !== phone));
      return;
    }

    updateRecipients([...selectedRecipients, phone]);
  }

  function addRawRecipient() {
    const phone = rawPhone.trim();

    if (!phonePattern.test(phone)) {
      setRawPhoneError('Use + followed by digits.');
      return;
    }

    if (!selectedRecipients.includes(phone)) {
      updateRecipients([...selectedRecipients, phone]);
    }

    setRawPhone('');
    setRawPhoneError(null);
  }

  function removeRecipient(phone: string) {
    updateRecipients(selectedRecipients.filter((recipient) => recipient !== phone));
  }

  function submit(values: MessageFormValues) {
    onSubmit({
      content: values.content,
      send_time: values.send_time,
      schedule_type: values.schedule_type,
      send_date: values.schedule_type === 'once' ? values.send_date || null : null,
      recipients: values.recipients,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)}>
      <div>
        <label htmlFor="content" className="mb-1.5 block text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="content"
          rows={5}
          {...register('content')}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          placeholder="Good morning, my love..."
        />
        {errors.content ? (
          <p className="mt-1.5 text-sm text-red-600">{errors.content.message}</p>
        ) : null}
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Recipients</p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedRecipients.length === 0 ? 'Will send to default number' : 'Selected contacts'}
          </p>
        </div>

        <input
          type="search"
          value={contactSearch}
          onChange={(event) => setContactSearch(event.target.value)}
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          placeholder="Search saved contacts"
        />

        <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => {
              const isSelected = selectedRecipients.includes(contact.phone);

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggleContact(contact.phone)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'bg-rose-50 text-rose-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-xs text-slate-500">{contact.phone}</span>
                </button>
              );
            })
          ) : (
            <p className="px-2 py-3 text-sm text-slate-500">No saved contacts found.</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={rawPhone}
            onChange={(event) => {
              setRawPhone(event.target.value);
              setRawPhoneError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addRawRecipient();
              }
            }}
            className="block min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            placeholder="+201012345678"
          />
          <button
            type="button"
            onClick={addRawRecipient}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50"
            title="Add phone number"
            aria-label="Add phone number"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {rawPhoneError ? <p className="text-sm text-red-600">{rawPhoneError}</p> : null}
        {errors.recipients ? (
          <p className="text-sm text-red-600">{errors.recipients.message}</p>
        ) : null}

        {selectedRecipients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedRecipients.map((phone) => (
              <span
                key={phone}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {getContactLabel(contacts, phone)}
                <button
                  type="button"
                  onClick={() => removeRecipient(phone)}
                  className="text-slate-500 transition hover:text-slate-900"
                  title="Remove recipient"
                  aria-label={`Remove ${phone}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Schedule</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700 transition hover:bg-slate-50">
            <input type="radio" value="daily" {...register('schedule_type')} />
            Daily (repeats)
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700 transition hover:bg-slate-50">
            <input type="radio" value="once" {...register('schedule_type')} />
            One-time (specific date)
          </label>
        </div>

        <div className={`grid gap-3 ${scheduleType === 'once' ? 'sm:grid-cols-2' : ''}`}>
          {scheduleType === 'once' ? (
            <div>
              <label htmlFor="send_date" className="mb-1.5 block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id="send_date"
                type="date"
                min={getTodayDate()}
                {...register('send_date')}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
              {errors.send_date ? (
                <p className="mt-1.5 text-sm text-red-600">{errors.send_date.message}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label htmlFor="send_time" className="mb-1.5 block text-sm font-medium text-slate-700">
              Time
            </label>
            <input
              id="send_time"
              type="time"
              {...register('send_time')}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            {errors.send_time ? (
              <p className="mt-1.5 text-sm text-red-600">{errors.send_time.message}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Saving' : 'Save'}
        </button>
      </div>
    </form>
  );
}
