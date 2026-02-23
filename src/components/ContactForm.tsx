import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

export function ContactForm() {
  const { t } = useTranslation('common');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = 'https://usebasin.com/f/7780932cba99';
    setStatus('submitting');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <p className="mt-2 text-green-600">{t('contactSuccess')}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 max-w-sm">
      {/* Basin honeypot */}
      <input type="hidden" name="_gotcha" />

      <input
        name="name"
        required
        placeholder={t('contactName')}
        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
      />
      <input
        name="email"
        type="email"
        required
        placeholder={t('contactEmail')}
        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
      />
      <textarea
        name="message"
        required
        rows={3}
        placeholder={t('contactMessage')}
        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="self-start rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {status === 'submitting' ? '...' : t('contactSend')}
      </button>
      {status === 'error' && <p className="text-xs text-red-500">{t('contactError')}</p>}
    </form>
  );
}
