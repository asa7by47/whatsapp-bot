import { QrCode } from 'lucide-react';

type QRCardProps = {
  qr?: string;
};

export function QRCard({ qr }: QRCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-slate-900">
        <QrCode className="h-5 w-5 text-rose-500" aria-hidden="true" />
        <h2 className="text-base font-semibold">WhatsApp QR</h2>
      </div>

      {qr ? (
        <div className="flex flex-col items-center gap-4">
          <img
            src={qr}
            alt="WhatsApp login QR code"
            className="aspect-square w-full max-w-72 rounded-md border border-slate-200 bg-white p-3"
          />
          <p className="text-center text-sm text-slate-600">
            Scan with WhatsApp on your phone to connect this scheduler.
          </p>
        </div>
      ) : (
        <div className="flex min-h-72 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Waiting for a QR code from WhatsApp.
        </div>
      )}
    </section>
  );
}
