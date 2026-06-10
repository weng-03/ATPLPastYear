export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center gap-4 animate-slide-up">
        {/* Loading spinner using SVG */}
        <div className="w-12 h-12 border-4 rounded-full border-t-[var(--sky-400)]" style={{ borderColor: 'var(--border-active)', borderTopColor: 'var(--sky-400)', animation: 'spin 1s linear infinite' }}></div>
        <p className="text-sm font-medium tracking-wide animate-pulse" style={{ color: 'var(--text-muted)' }}>
          Preparing your cockpit...
        </p>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
