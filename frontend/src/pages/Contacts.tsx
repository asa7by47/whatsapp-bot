import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  createContact,
  deleteContact,
  getContacts,
  getWhatsAppContacts,
  type WhatsAppContact,
} from '../api/client';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+\d+$/, 'Phone must start with + and contain only digits after it.'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function Contacts() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedImports, setSelectedImports] = useState<string[]>([]);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });

  const whatsappQuery = useQuery({
    queryKey: ['contacts', 'whatsapp'],
    queryFn: getWhatsAppContacts,
    enabled: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!isAddOpen) {
      reset({ name: '', phone: '' });
    }
  }, [isAddOpen, reset]);

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (items: WhatsAppContact[]) => {
      await Promise.allSettled(
        items.map((item) => createContact({ name: item.name, phone: item.phone })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedImports([]);
      setIsImportOpen(false);
    },
  });

  function openImportModal() {
    setIsImportOpen(true);
    setSelectedImports([]);
    whatsappQuery.refetch();
  }

  function toggleImport(phone: string) {
    setSelectedImports((current) =>
      current.includes(phone)
        ? current.filter((selectedPhone) => selectedPhone !== phone)
        : [...current, phone],
    );
  }

  function saveSelectedImports() {
    const whatsappContacts = whatsappQuery.data ?? [];
    const selected = whatsappContacts.filter((contact) => selectedImports.includes(contact.phone));
    importMutation.mutate(selected);
  }

  function submit(values: ContactFormValues) {
    createMutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-rose-600">Recipients</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Contacts</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={openImportModal}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Import from WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Contact
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading contacts...</div>
        ) : contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="w-20 px-4 py-3 font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{contact.name}</td>
                    <td className="px-4 py-3 text-slate-600">{contact.phone}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(contact.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                        title="Delete contact"
                        aria-label={`Delete ${contact.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">No contacts saved yet.</div>
        )}
      </section>

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950">Add Contact</h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                title="Close"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit(submit)}>
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  {...register('name')}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
                {errors.name ? (
                  <p className="mt-1.5 text-sm text-red-600">{errors.name.message}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  id="contact-phone"
                  type="text"
                  {...register('phone')}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  placeholder="+201012345678"
                />
                {errors.phone ? (
                  <p className="mt-1.5 text-sm text-red-600">{errors.phone.message}</p>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                >
                  {createMutation.isPending ? 'Saving' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isImportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950">Import from WhatsApp</h2>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                title="Close"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-2">
              {whatsappQuery.isFetching ? (
                <p className="px-2 py-6 text-center text-sm text-slate-500">Loading recent chats...</p>
              ) : whatsappQuery.data && whatsappQuery.data.length > 0 ? (
                whatsappQuery.data.map((contact) => (
                  <label
                    key={contact.phone}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm transition hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedImports.includes(contact.phone)}
                      onChange={() => toggleImport(contact.phone)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{contact.name}</span>
                      <span className="block text-xs text-slate-500">{contact.phone}</span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="px-2 py-6 text-center text-sm text-slate-500">No recent chats found.</p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSelectedImports}
                disabled={selectedImports.length === 0 || importMutation.isPending}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {importMutation.isPending ? 'Saving' : 'Save selected'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
