'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-md w-full card rounded-2xl p-8 text-center animate-slide-up">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--incorrect-dim)', color: 'var(--incorrect)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong!</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          We encountered an unexpected error. Don't worry, your progress might still be saved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold transition-transform hover:scale-105"
            style={{ background: 'var(--sky-600)', color: '#fff' }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold transition-colors"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
