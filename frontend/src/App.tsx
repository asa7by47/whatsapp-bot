import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarClock, LayoutDashboard, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNotifications } from './hooks/useNotifications';
import { Contacts } from './pages/Contacts';
import { Dashboard } from './pages/Dashboard';
import { Messages } from './pages/Messages';

type Page = 'dashboard' | 'messages' | 'contacts';

function pageFromPath(pathname: string): Page {
  if (pathname === '/messages') {
    return 'messages';
  }

  if (pathname === '/contacts') {
    return 'contacts';
  }

  return 'dashboard';
}

function AppShell() {
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const notificationToast = useNotifications();

  useEffect(() => {
    function handlePopState() {
      setPage(pageFromPath(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(nextPage: Page) {
    const path = nextPage === 'dashboard' ? '/' : `/${nextPage}`;
    window.history.pushState({}, '', path);
    setPage(nextPage);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
              WhatsApp scheduler
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">Romantic message bot</p>
          </div>

          <nav className="inline-flex w-full rounded-md border border-slate-200 bg-slate-100 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('dashboard')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition sm:flex-none ${
                page === 'dashboard'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('messages')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition sm:flex-none ${
                page === 'messages'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Messages
            </button>
            <button
              type="button"
              onClick={() => navigate('contacts')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition sm:flex-none ${
                page === 'contacts'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Contacts
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {page === 'dashboard' ? <Dashboard /> : null}
        {page === 'messages' ? <Messages /> : null}
        {page === 'contacts' ? <Contacts /> : null}
      </main>

      <div className="fixed bottom-4 right-4 z-50">
        {notificationToast ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 shadow">
            Message sent to {notificationToast.recipient_name} at {notificationToast.sent_at}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
