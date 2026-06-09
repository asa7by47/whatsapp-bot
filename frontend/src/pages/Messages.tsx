import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import {
  createMessage,
  deleteMessage,
  getMessages,
  type MessagePayload,
  type ScheduledMessage,
  type UpdateMessagePayload,
  updateMessage,
} from '../api/client';
import { MessageCard } from '../components/MessageCard';
import { MessageForm } from '../components/MessageForm';

export function Messages() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: getMessages,
  });

  const createMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMessagePayload }) =>
      updateMessage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  function openCreateModal() {
    setEditingMessage(null);
    setIsModalOpen(true);
  }

  function openEditModal(message: ScheduledMessage) {
    setEditingMessage(message);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingMessage(null);
  }

  function handleSubmit(payload: MessagePayload) {
    if (editingMessage) {
      updateMutation.mutate({
        id: editingMessage.id,
        payload: {
          ...payload,
          is_enabled: editingMessage.is_enabled,
        },
      });
      return;
    }

    createMutation.mutate(payload);
  }

  function handleToggle(message: ScheduledMessage) {
    updateMutation.mutate({
      id: message.id,
      payload: {
        content: message.content,
        send_time: message.send_time,
        recipients: message.recipients,
        schedule_type: message.schedule_type,
        send_date: message.send_date,
        is_enabled: message.is_enabled === 1 ? 0 : 1,
      },
    });
  }

  function handleDelete(message: ScheduledMessage) {
    const confirmed = window.confirm('Delete this scheduled message?');

    if (confirmed) {
      deleteMutation.mutate(message.id);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-rose-600">Scheduled messages</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Message queue</h1>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Message
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading scheduled messages...
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onToggle={handleToggle}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No messages scheduled yet.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Message
          </button>
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950">
                {editingMessage ? 'Edit Message' : 'Add Message'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                title="Close"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <MessageForm
              initialMessage={editingMessage}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={closeModal}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
