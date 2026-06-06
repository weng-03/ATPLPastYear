"use client";

import { signOut } from "@/app/login/actions";
import { useTheme } from "@/components/ThemeProvider";

interface HeaderProps {
  email: string;
}

export default function Header({ email }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
      style={{
        background: "var(--header-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent)" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-white"
          >
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <div>
          <span className="font-bold text-base leading-tight block" style={{ color: "var(--text-primary)" }}>
            ATPL Past Year
          </span>
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: "var(--sky-400)" }}
          >
            Exam Preparation
          </span>
        </div>
      </div>

      {/* Right side: theme toggle + user + sign out */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          id="btn-theme-toggle"
          type="button"
          onClick={toggle}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200"
          style={{
            background: "var(--bg-overlay)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            /* Sun icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            /* Moon icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* User info */}
        <div className="hidden sm:block text-right">
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Signed in as
          </p>
          <a href="/profile" className="text-sm font-semibold truncate max-w-[200px] hover:underline block" style={{ color: "var(--text-primary)" }}>
            {email}
          </a>
        </div>

        {/* Sign out */}
        <form action={signOut}>
          <button
            id="btn-signout"
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "rgba(239,68,68,0.4)";
              el.style.color = "var(--incorrect)";
              el.style.background = "var(--incorrect-dim)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--border)";
              el.style.color = "var(--text-secondary)";
              el.style.background = "var(--bg-overlay)";
            }}
          >
            Sign Out
          </button>
        </form>
      </div>
    </header>
  );
}
