"use client";

import { useActionState, useState, useTransition } from "react";
import { signIn, signUp, signInAsGuest, type AuthActionState } from "./actions";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signinState, signinAction, signinPending] = useActionState<AuthActionState, FormData>(signIn, null);
  const [signupState, signupAction, signupPending] = useActionState<AuthActionState, FormData>(signUp, null);
  const [guestPending, startGuestTransition] = useTransition();
  const [guestError, setGuestError] = useState<string | null>(null);
  const { theme, toggle } = useTheme();

  const isSignIn = mode === "signin";
  const currentState = isSignIn ? signinState : signupState;
  const isPending = isSignIn ? signinPending : signupPending;

  async function handleGuest() {
    setGuestError(null);
    startGuestTransition(async () => {
      const result = await signInAsGuest();
      if (result?.error) setGuestError(result.error);
    });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 text-white"
              >
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                ATPL Past Year
              </h1>
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--sky-400)" }}>
                Aviation Exam Prep
              </p>
            </div>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {isSignIn
              ? "Welcome back, pilot. Ready to study?"
              : "Create your account to start studying."}
          </p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl p-8">
          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: "var(--bg-elevated)" }}
          >
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setMode(tab)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: mode === tab ? "var(--bg-overlay)" : "transparent",
                  color: mode === tab ? "var(--sky-400)" : "var(--text-muted)",
                }}
              >
                {tab === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Status messages */}
          {currentState?.error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "var(--incorrect-dim)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "var(--incorrect)",
              }}
            >
              ⚠ {currentState.error}
            </div>
          )}
          {currentState?.success && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                background: "var(--correct-dim)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "var(--correct)",
              }}
            >
              ✓ {currentState.success}
            </div>
          )}

          {/* Form */}
          <form action={isSignIn ? signinAction : signupAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="pilot@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus-ring"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--border-active)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                required
                placeholder={isSignIn ? "••••••••" : "Min. 8 characters"}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--border-active)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
            </div>

            <button
              id={`btn-${mode}`}
              type="submit"
              disabled={isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "var(--sky-600)",
                color: "white",
              }}
              onMouseEnter={(e) => {
                if (!isPending) {
                  (e.target as HTMLElement).style.background = "var(--sky-500)";
                  (e.target as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "var(--sky-600)";
                (e.target as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isSignIn ? "Signing in…" : "Creating account…"}
                </span>
              ) : isSignIn ? (
                "Sign In →"
              ) : (
                "Create Account →"
              )}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Guest mode button */}
        {guestError && (
          <div
            className="mt-3 px-4 py-2.5 rounded-lg text-xs font-medium"
            style={{
              background: "var(--incorrect-dim)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--incorrect)",
            }}
          >
            ⚠ {guestError} — See setup guide below.
          </div>
        )}
        <button
          id="btn-guest"
          type="button"
          disabled={guestPending}
          onClick={handleGuest}
          className="w-full mt-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
            (e.currentTarget as HTMLElement).style.color = "var(--sky-400)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          {guestPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Entering as Guest…
            </span>
          ) : (
            "🚀 Continue as Guest (Testing)"
          )}
        </button>

        {/* Footer — theme toggle + tagline */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Study smart. Fly safe. ✈
          </p>
          <button
            type="button"
            onClick={toggle}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </div>
  );
}
